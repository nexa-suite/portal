import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = join(repositoryRoot, 'src', 'app');
const contextsRoot = appRoot;
const layers = ['application', 'domain', 'infrastructure', 'presentation'];
const technicalModules = ['iam', 'tenantmanagement'];
const contexts = [
  'tenantaccessgovernance',
  'customerbuyerrelationships',
  'catalogcommercialpolicy',
  'salescommitment',
  'inventoryavailability',
  'fulfillmentdelivery',
  'creditreceivables',
  'payments',
  'businessdocuments',
  'notifications',
  'businesstraceability',
];
const contextSet = new Set(contexts);
const errors = [];

const toPosix = (value) => value.split(sep).join('/');
const appRelative = (value) => toPosix(relative(appRoot, value));
const boundedContextRelative = (context, value) => toPosix(relative(join(contextsRoot, context), value));

function files(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function contextFromPath(path) {
  const match = appRelative(path).match(/^([^/]+)(?:\/|$)/);
  return match && contextSet.has(match[1]) ? match[1] : null;
}

function sourceLocation(context, path) {
  const contextRelative = boundedContextRelative(context, path);
  const parts = contextRelative.split('/');
  if (context === contexts[0] && technicalModules.includes(parts[0])) {
    return { module: parts[0], layer: layers.includes(parts[1]) ? parts[1] : null, relative: contextRelative };
  }
  return { module: null, layer: layers.includes(parts[0]) ? parts[0] : null, relative: contextRelative };
}

function locationOf(path) {
  const context = contextFromPath(path);
  return context ? { context, ...sourceLocation(context, path) } : null;
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function resolveModule(sourceFile, specifier) {
  const raw = resolve(dirname(sourceFile), specifier);
  const candidates = [raw, `${raw}.ts`, `${raw}.tsx`, `${raw}.js`, `${raw}.json`];
  for (const candidate of candidates) if (isFile(candidate)) return candidate;
  for (const extension of ['.ts', '.tsx', '.js', '.json']) {
    const candidate = join(raw, `index${extension}`);
    if (isFile(candidate)) return candidate;
  }
  return null;
}

function importsOf(source) {
  const imports = [];
  const pattern = /(?:\bfrom\s*|\bimport\s*(?:type\s*)?(?:\(\s*)?)(['"])([^'"]+)\1/g;
  for (const match of source.matchAll(pattern)) imports.push(match[2]);
  return imports;
}

function isForbiddenDomainDependency(specifier) {
  return /^(?:@angular(?:\/|$)|@ngx-translate(?:\/|$)|rxjs(?:\/|$)|node-fetch(?:\/|$)|axios(?:\/|$)|undici(?:\/|$)|https?:\/\/)/.test(specifier);
}

function isExplicitComposition(sourcePath) {
  return sourcePath === 'app.config.ts'
    || sourcePath === 'app.routes.ts'
    || sourcePath.startsWith('core/compositions/')
    || sourcePath.startsWith('core/change-feed/')
    || sourcePath.startsWith('core/layout/')
    || sourcePath.startsWith('core/presentation/home-page/')
    || sourcePath === 'core/security/portal-security.boundary.ts'
    || sourcePath === 'core/security/portal-security.contract.ts'
    || sourcePath === 'core/security/portal-security.adapter.ts';
}

function isExplicitInfrastructureAdapter(sourceLocationValue, targetLocationValue, sourcePath) {
  return sourceLocationValue?.layer === 'infrastructure'
    && targetLocationValue?.layer === 'application'
    && targetLocationValue.relative.split('/').includes('ports')
    && /(?:^|\/)(?:[^/]*(?:acl|adapter|gateway)[^/]*)\.ts$/i.test(sourcePath);
}

function validateLayer(context, module, layer) {
  const layerPath = module
    ? join(contextsRoot, context, module, layer)
    : join(contextsRoot, context, layer);
  const displayPath = appRelative(layerPath);
  if (!existsSync(layerPath)) {
    errors.push(`missing required layer: ${displayPath}`);
    return;
  }

  const layerFiles = files(layerPath);
  if (!layerFiles.length) errors.push(`empty required layer: ${displayPath}`);
  if (layerFiles.some((path) => basename(path) === '.gitkeep')) {
    errors.push(`placeholder is not a concrete layer owner: ${displayPath}/.gitkeep`);
  }
  if (!layerFiles.some((path) => basename(path).toLowerCase() === 'readme.md')
      && !layerFiles.some((path) => extname(path) === '.ts')) {
    errors.push(`contract-free layer must document its absence: ${displayPath}/README.md`);
  }
}

function validateContext(context) {
  const contextPath = join(contextsRoot, context);
  if (!existsSync(contextPath)) {
    errors.push(`missing canonical context: ${context}`);
    return;
  }

  const readme = join(contextPath, 'README.md');
  if (!existsSync(readme)) errors.push(`missing concrete owner documentation: ${appRelative(readme)}`);
  else if (!/responsable frontend|ownership|owner/i.test(readFileSync(readme, 'utf8'))) {
    errors.push(`owner documentation must name the frontend owner: ${appRelative(readme)}`);
  }

  const expectedChildren = context === contexts[0] ? technicalModules : layers;
  const allowedChildren = new Set(['README.md', ...expectedChildren]);
  for (const entry of readdirSync(contextPath, { withFileTypes: true })) {
    if (!allowedChildren.has(entry.name)) errors.push(`legacy or nested BC root remains: ${appRelative(join(contextPath, entry.name))}`);
  }

  if (context === contexts[0]) {
    for (const module of technicalModules) {
      const modulePath = join(contextPath, module);
      if (!existsSync(modulePath)) {
        errors.push(`missing BC-01 technical module: ${appRelative(modulePath)}`);
        continue;
      }
      for (const layer of layers) validateLayer(context, module, layer);
      for (const entry of readdirSync(modulePath, { withFileTypes: true })) {
        if (!layers.includes(entry.name)) errors.push(`unexpected BC-01 module child: ${appRelative(join(modulePath, entry.name))}`);
      }
    }
  } else {
    for (const layer of layers) validateLayer(context, null, layer);
  }
}

for (const context of contexts) validateContext(context);

if (existsSync(appRoot)) {
  const allowedAppDirectories = new Set([...contexts, 'core', 'shared']);
  for (const entry of readdirSync(appRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && !allowedAppDirectories.has(entry.name)) {
      errors.push(`unexpected app root: ${appRelative(join(appRoot, entry.name))}`);
    }
  }
}

for (const legacyRoot of [
  'bounded-contexts',
  'BC-01-tenant-access-governance', 'BC-02-customer-buyer-relationships',
  'BC-03-catalog-commercial-policy', 'BC-04-sales-commitment',
  'BC-05-inventory-availability', 'BC-06-fulfillment-delivery',
  'BC-07-credit-receivables', 'BC-08-payments', 'BC-09-business-documents',
  'BC-10-notifications', 'BC-11-business-traceability',
  'iam', 'catalog-management', 'sales', 'warehouse', 'logistics',
  'documents', 'invoicing', 'support', 'tenantmanagement', 'tenant-management',
]) {
  const path = join(appRoot, legacyRoot);
  if (existsSync(path)) errors.push(`legacy root remains: ${appRelative(path)}`);
}

const productionTypeScriptFiles = files(appRoot)
  .filter((path) => extname(path) === '.ts' && !basename(path).endsWith('.spec.ts'));
const testTypeScriptFiles = files(appRoot)
  .filter((path) => extname(path) === '.ts' && basename(path).endsWith('.spec.ts'));
if (!testTypeScriptFiles.length) errors.push('validator found no TypeScript tests to inspect');
const allTypeScriptFiles = [...productionTypeScriptFiles, ...testTypeScriptFiles];
for (const file of allTypeScriptFiles) {
  const sourceLocationValue = locationOf(file);
  const sourcePath = appRelative(file);
  const source = readFileSync(file, 'utf8');

  if (basename(file).endsWith('.controller.ts') && sourceLocationValue?.layer !== 'presentation') {
    errors.push(`controller must live under presentation: ${sourcePath}`);
  }
  if (sourceLocationValue && !sourceLocationValue.layer) {
    errors.push(`BC code must live under a direct layer: ${sourcePath}`);
  }
  if (sourceLocationValue?.layer === 'domain' && /\b(?:HttpClient|HttpRequest|HttpResponse|fetch\s*\()/u.test(source)) {
    errors.push(`domain must be framework/HTTP-free: ${sourcePath}`);
  }

  for (const specifier of importsOf(source)) {
    if (sourceLocationValue?.layer === 'domain' && isForbiddenDomainDependency(specifier)) {
      errors.push(`domain imports framework/HTTP dependency: ${sourcePath} -> ${specifier}`);
    }
    if (!specifier.startsWith('.')) continue;

    const target = resolveModule(file, specifier);
    if (!target) {
      errors.push(`unresolved relative import: ${sourcePath} -> ${specifier}`);
      continue;
    }

    const targetLocationValue = locationOf(target);
    if (!sourceLocationValue) {
      if (targetLocationValue && !isExplicitComposition(sourcePath)) {
        errors.push(`cross-BC import must be an explicit composition: ${sourcePath} -> ${appRelative(target)}`);
      }
      continue;
    }
    if (!targetLocationValue) {
      if (sourceLocationValue.layer === 'domain') {
        errors.push(`domain imports outside its BC boundary: ${sourcePath} -> ${appRelative(target)}`);
      }
      continue;
    }

    if (sourceLocationValue.context === targetLocationValue.context) {
      if (sourceLocationValue.layer === 'domain' && targetLocationValue.layer !== 'domain') {
        errors.push(`domain imports outer layer: ${sourcePath} -> ${appRelative(target)}`);
      }
      if (sourceLocationValue.layer === 'application' && targetLocationValue.layer === 'presentation') {
        errors.push(`application imports presentation: ${sourcePath} -> ${appRelative(target)}`);
      }
      if ((sourceLocationValue.layer === 'application' || sourceLocationValue.layer === 'domain')
          && targetLocationValue.context === contexts[0]
          && targetLocationValue.module === 'iam'
          && targetLocationValue.layer === 'infrastructure') {
        errors.push(`application/domain imports BC-01 security infrastructure: ${sourcePath} -> ${appRelative(target)}`);
      }
      if (sourceLocationValue.layer === 'application' && targetLocationValue.layer === 'infrastructure') {
        errors.push(`application imports infrastructure adapter: ${sourcePath} -> ${appRelative(target)}`);
      }
      if (sourceLocationValue.layer === 'presentation' && targetLocationValue.layer === 'infrastructure') {
        errors.push(`presentation imports infrastructure adapter: ${sourcePath} -> ${appRelative(target)}`);
      }
      continue;
    }

    const allowedCrossContext = isExplicitComposition(sourcePath)
      || isExplicitInfrastructureAdapter(sourceLocationValue, targetLocationValue, sourcePath);
    if (!allowedCrossContext) errors.push(`implicit cross-BC import: ${sourcePath} -> ${appRelative(target)}`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Bounded-context architecture PASS (${contexts.length} canonical contexts, four layers, production and test dependencies, explicit cross-BC boundaries)`);
