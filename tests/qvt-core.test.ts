import { describe, it, expect, beforeEach } from 'vitest';
import {
  BasicEPackage,
  BasicEClass,
  BasicEAttribute,
  BasicEReference,
  BasicEFactory,
  EcoreDataTypes,
} from 'emfts';
import type { EObject, EClass, EPackage, EAttribute, EReference } from 'emfts';
import { BindingEnvironment } from '../src/runtime/BindingEnvironment.js';
import { ModelExtent } from '../src/runtime/ModelExtent.js';
import { PatternMatcher } from '../src/runtime/PatternMatcher.js';
import { PatternEnforcer } from '../src/runtime/PatternEnforcer.js';
import { TraceModel } from '../src/trace/TraceModel.js';
import { ExecutionDiagnostic, DiagnosticSeverity } from '../src/runtime/ExecutionDiagnostic.js';
import type { ObjectTemplateExp, Key } from '../src/index.js';

// ============================================================
// Test Metamodel: UML (simplified)
// ============================================================
let umlPackage: EPackage;
let packageClass: EClass;
let classClass: EClass;
let attributeClass: EClass;
let packageName: EAttribute;
let className: EAttribute;
let classIsAbstract: EAttribute;
let classNamespace: EReference;
let classAttributes: EReference;
let attributeName: EAttribute;

// RDBMS metamodel
let rdbmsPackage: EPackage;
let schemaClass: EClass;
let tableClass: EClass;
let columnClass: EClass;
let schemaName: EAttribute;
let tableName: EAttribute;
let tableSchema: EReference;
let tableColumns: EReference;
let columnName: EAttribute;
let columnType: EAttribute;

function createUmlMetamodel() {
  packageClass = new BasicEClass();
  packageClass.setName('Package');

  packageName = new BasicEAttribute();
  packageName.setName('name');
  packageName.setEType(EcoreDataTypes.EString);
  (packageClass as BasicEClass).addFeature(packageName);

  classClass = new BasicEClass();
  classClass.setName('Class');

  className = new BasicEAttribute();
  className.setName('name');
  className.setEType(EcoreDataTypes.EString);
  (classClass as BasicEClass).addFeature(className);

  classIsAbstract = new BasicEAttribute();
  classIsAbstract.setName('isAbstract');
  classIsAbstract.setEType(EcoreDataTypes.EBoolean);
  (classClass as BasicEClass).addFeature(classIsAbstract);

  classNamespace = new BasicEReference();
  classNamespace.setName('namespace');
  classNamespace.setEType(packageClass);
  (classClass as BasicEClass).addFeature(classNamespace);

  classAttributes = new BasicEReference();
  classAttributes.setName('attributes');
  classAttributes.setEType(null as unknown as EClass); // set below
  classAttributes.setUpperBound(-1);
  classAttributes.setContainment(true);
  (classClass as BasicEClass).addFeature(classAttributes);

  attributeClass = new BasicEClass();
  attributeClass.setName('Attribute');

  attributeName = new BasicEAttribute();
  attributeName.setName('name');
  attributeName.setEType(EcoreDataTypes.EString);
  (attributeClass as BasicEClass).addFeature(attributeName);

  classAttributes.setEType(attributeClass);

  umlPackage = new (class extends BasicEPackage {
    constructor() {
      super();
      this.setName('UML');
      this.setNsPrefix('uml');
      this.setNsURI('http://example.com/uml');
    }
  })();
  umlPackage.getEClassifiers().push(packageClass);
  umlPackage.getEClassifiers().push(classClass);
  umlPackage.getEClassifiers().push(attributeClass);
}

function createRdbmsMetamodel() {
  schemaClass = new BasicEClass();
  schemaClass.setName('Schema');

  schemaName = new BasicEAttribute();
  schemaName.setName('name');
  schemaName.setEType(EcoreDataTypes.EString);
  (schemaClass as BasicEClass).addFeature(schemaName);

  tableClass = new BasicEClass();
  tableClass.setName('Table');

  tableName = new BasicEAttribute();
  tableName.setName('name');
  tableName.setEType(EcoreDataTypes.EString);
  (tableClass as BasicEClass).addFeature(tableName);

  tableSchema = new BasicEReference();
  tableSchema.setName('schema');
  tableSchema.setEType(schemaClass);
  (tableClass as BasicEClass).addFeature(tableSchema);

  tableColumns = new BasicEReference();
  tableColumns.setName('columns');
  tableColumns.setUpperBound(-1);
  tableColumns.setContainment(true);
  (tableClass as BasicEClass).addFeature(tableColumns);

  columnClass = new BasicEClass();
  columnClass.setName('Column');

  columnName = new BasicEAttribute();
  columnName.setName('name');
  columnName.setEType(EcoreDataTypes.EString);
  (columnClass as BasicEClass).addFeature(columnName);

  columnType = new BasicEAttribute();
  columnType.setName('type');
  columnType.setEType(EcoreDataTypes.EString);
  (columnClass as BasicEClass).addFeature(columnType);

  tableColumns.setEType(columnClass);

  rdbmsPackage = new (class extends BasicEPackage {
    constructor() {
      super();
      this.setName('RDBMS');
      this.setNsPrefix('rdbms');
      this.setNsURI('http://example.com/rdbms');
    }
  })();
  rdbmsPackage.getEClassifiers().push(schemaClass);
  rdbmsPackage.getEClassifiers().push(tableClass);
  rdbmsPackage.getEClassifiers().push(columnClass);
}

// ============================================================
// BindingEnvironment Tests
// ============================================================
describe('BindingEnvironment', () => {
  it('should create empty environment', () => {
    const env = new BindingEnvironment();
    expect(env.size).toBe(0);
    expect(env.has('x')).toBe(false);
  });

  it('should bind and retrieve variables', () => {
    const env = new BindingEnvironment();
    const env2 = env.tryBind('x', 42);
    expect(env2).not.toBeNull();
    expect(env2!.get('x')).toBe(42);
    expect(env2!.has('x')).toBe(true);
  });

  it('should be immutable — original unchanged', () => {
    const env = new BindingEnvironment();
    const env2 = env.tryBind('x', 42);
    expect(env.has('x')).toBe(false);
    expect(env2!.has('x')).toBe(true);
  });

  it('should allow binding same value (idempotent)', () => {
    const env = new BindingEnvironment();
    const env2 = env.tryBind('x', 42)!;
    const env3 = env2.tryBind('x', 42);
    expect(env3).toBe(env2); // same instance
  });

  it('should fail on conflicting bindings', () => {
    const env = new BindingEnvironment();
    const env2 = env.tryBind('x', 42)!;
    const env3 = env2.tryBind('x', 99);
    expect(env3).toBeNull();
  });

  it('should export to record', () => {
    const env = new BindingEnvironment();
    const env2 = env.tryBind('x', 1)!.tryBind('y', 'hello')!;
    const record = env2.toRecord();
    expect(record).toEqual({ x: 1, y: 'hello' });
  });

  it('should create child scopes', () => {
    const parent = new BindingEnvironment().tryBind('x', 1)!;
    const child = parent.child();
    const child2 = child.tryBind('y', 2);
    expect(child2!.get('x')).toBe(1);
    expect(child2!.get('y')).toBe(2);
    expect(parent.has('y')).toBe(false);
  });
});

// ============================================================
// ModelExtent Tests
// ============================================================
describe('ModelExtent', () => {
  beforeEach(() => {
    createUmlMetamodel();
  });

  it('should add and retrieve elements', () => {
    const extent = new ModelExtent();
    const factory = umlPackage.getEFactoryInstance();
    const p = factory.create(packageClass);
    p.eSet(packageName, 'myPackage');

    extent.add(p);
    expect(extent.size).toBe(1);
    expect(extent.getContents()).toHaveLength(1);
    expect(extent.getContents()[0]).toBe(p);
  });

  it('should find objects by type', () => {
    const extent = new ModelExtent();
    const factory = umlPackage.getEFactoryInstance();

    const p = factory.create(packageClass);
    const c = factory.create(classClass);

    extent.add(p);
    extent.add(c);

    expect(extent.objectsOfType(packageClass)).toHaveLength(1);
    expect(extent.objectsOfType(classClass)).toHaveLength(1);
  });

  it('should support setContents', () => {
    const extent = new ModelExtent();
    const factory = umlPackage.getEFactoryInstance();

    const p = factory.create(packageClass);
    extent.add(p);
    expect(extent.size).toBe(1);

    extent.setContents([]);
    expect(extent.size).toBe(0);
  });

  it('should initialize with elements', () => {
    const factory = umlPackage.getEFactoryInstance();
    const p = factory.create(packageClass);
    const c = factory.create(classClass);

    const extent = new ModelExtent([p, c]);
    expect(extent.size).toBe(2);
  });
});

// ============================================================
// PatternMatcher Tests
// ============================================================
describe('PatternMatcher', () => {
  let factory: ReturnType<EPackage['getEFactoryInstance']>;

  beforeEach(() => {
    createUmlMetamodel();
    factory = umlPackage.getEFactoryInstance();
  });

  it('should match objects by type', () => {
    const matcher = new PatternMatcher();
    const extent = new ModelExtent();

    const p = factory.create(packageClass);
    p.eSet(packageName, 'myPkg');

    extent.add(p);

    const template: ObjectTemplateExp = {
      referredClass: packageClass,
      bindVariable: 'p',
      parts: [],
    };

    const env = new BindingEnvironment();
    const matches = [...matcher.findMatches(template, extent, env)];

    expect(matches).toHaveLength(1);
    expect(matches[0].get('p')).toBe(p);
  });

  it('should match and bind attribute values', () => {
    const matcher = new PatternMatcher();
    const extent = new ModelExtent();

    const p = factory.create(packageClass);
    p.eSet(packageName, 'myPkg');
    extent.add(p);

    const template: ObjectTemplateExp = {
      referredClass: packageClass,
      bindVariable: 'p',
      parts: [{
        referredProperty: packageName,
        value: { kind: 'variable', name: 'pn' },
        isOpposite: false,
      }],
    };

    const env = new BindingEnvironment();
    const matches = [...matcher.findMatches(template, extent, env)];

    expect(matches).toHaveLength(1);
    expect(matches[0].get('p')).toBe(p);
    expect(matches[0].get('pn')).toBe('myPkg');
  });

  it('should filter by literal value', () => {
    const matcher = new PatternMatcher();
    const extent = new ModelExtent();

    const p1 = factory.create(packageClass);
    p1.eSet(packageName, 'pkg1');
    const p2 = factory.create(packageClass);
    p2.eSet(packageName, 'pkg2');

    extent.add(p1);
    extent.add(p2);

    const template: ObjectTemplateExp = {
      referredClass: packageClass,
      bindVariable: 'p',
      parts: [{
        referredProperty: packageName,
        value: { kind: 'literal', value: 'pkg1' },
        isOpposite: false,
      }],
    };

    const matches = [...matcher.findMatches(template, extent, new BindingEnvironment())];
    expect(matches).toHaveLength(1);
    expect(matches[0].get('p')).toBe(p1);
  });

  it('should match nested templates', () => {
    const matcher = new PatternMatcher();
    const extent = new ModelExtent();

    const pkg = factory.create(packageClass);
    pkg.eSet(packageName, 'myPkg');

    const cls = factory.create(classClass);
    cls.eSet(className, 'MyClass');
    cls.eSet(classNamespace, pkg);

    extent.add(pkg);
    extent.add(cls);

    const template: ObjectTemplateExp = {
      referredClass: classClass,
      bindVariable: 'c',
      parts: [{
        referredProperty: className,
        value: { kind: 'variable', name: 'cn' },
        isOpposite: false,
      }, {
        referredProperty: classNamespace,
        value: {
          kind: 'template',
          template: {
            referredClass: packageClass,
            bindVariable: 'p',
            parts: [],
          },
        },
        isOpposite: false,
      }],
    };

    const matches = [...matcher.findMatches(template, extent, new BindingEnvironment())];
    expect(matches).toHaveLength(1);
    expect(matches[0].get('c')).toBe(cls);
    expect(matches[0].get('cn')).toBe('MyClass');
    expect(matches[0].get('p')).toBe(pkg);
  });

  it('should skip non-matching types', () => {
    const matcher = new PatternMatcher();
    const extent = new ModelExtent();

    const pkg = factory.create(packageClass);
    extent.add(pkg);

    const template: ObjectTemplateExp = {
      referredClass: classClass,
      parts: [],
    };

    const matches = [...matcher.findMatches(template, extent, new BindingEnvironment())];
    expect(matches).toHaveLength(0);
  });

  it('should use pre-bound variable', () => {
    const matcher = new PatternMatcher();
    const extent = new ModelExtent();

    const p1 = factory.create(packageClass);
    p1.eSet(packageName, 'pkg1');
    const p2 = factory.create(packageClass);
    p2.eSet(packageName, 'pkg2');

    extent.add(p1);
    extent.add(p2);

    const template: ObjectTemplateExp = {
      referredClass: packageClass,
      bindVariable: 'p',
      parts: [{
        referredProperty: packageName,
        value: { kind: 'variable', name: 'pn' },
        isOpposite: false,
      }],
    };

    // Pre-bind 'p' to p2
    const env = new BindingEnvironment().tryBind('p', p2)!;
    const matches = [...matcher.findMatches(template, extent, env)];
    expect(matches).toHaveLength(1);
    expect(matches[0].get('pn')).toBe('pkg2');
  });
});

// ============================================================
// PatternEnforcer Tests
// ============================================================
describe('PatternEnforcer', () => {
  beforeEach(() => {
    createRdbmsMetamodel();
  });

  it('should create new object from template', () => {
    const enforcer = new PatternEnforcer();
    const trace = new TraceModel();

    const template: ObjectTemplateExp = {
      referredClass: schemaClass,
      bindVariable: 's',
      parts: [{
        referredProperty: schemaName,
        value: { kind: 'variable', name: 'pn' },
        isOpposite: false,
      }],
    };

    const env = new BindingEnvironment().tryBind('pn', 'mySchema')!;
    const result = enforcer.enforce(template, env, trace, []);

    expect(result).toBeDefined();
    expect(result.eClass()).toBe(schemaClass);
    expect(result.eGet(schemaName)).toBe('mySchema');
  });

  it('should reuse existing object from bound variable', () => {
    const enforcer = new PatternEnforcer();
    const trace = new TraceModel();
    const existingSchema = rdbmsPackage.getEFactoryInstance().create(schemaClass);
    existingSchema.eSet(schemaName, 'existing');

    const template: ObjectTemplateExp = {
      referredClass: schemaClass,
      bindVariable: 's',
      parts: [{
        referredProperty: schemaName,
        value: { kind: 'literal', value: 'updated' },
        isOpposite: false,
      }],
    };

    const env = new BindingEnvironment().tryBind('s', existingSchema)!;
    const result = enforcer.enforce(template, env, trace, []);

    expect(result).toBe(existingSchema);
    expect(result.eGet(schemaName)).toBe('updated');
  });

  it('should find existing object by key', () => {
    const enforcer = new PatternEnforcer();
    const trace = new TraceModel();

    const existingTable = rdbmsPackage.getEFactoryInstance().create(tableClass);
    existingTable.eSet(tableName, 'Users');
    trace.addTrace(existingTable, existingTable, 'dummy'); // just so findByKey can find it

    const key: Key = { identifies: tableClass, parts: [tableName] };

    const template: ObjectTemplateExp = {
      referredClass: tableClass,
      bindVariable: 't',
      parts: [{
        referredProperty: tableName,
        value: { kind: 'literal', value: 'Users' },
        isOpposite: false,
      }],
    };

    const env = new BindingEnvironment();
    const result = enforcer.enforce(template, env, trace, [key]);

    expect(result).toBe(existingTable);
  });
});

// ============================================================
// TraceModel Tests
// ============================================================
describe('TraceModel', () => {
  beforeEach(() => {
    createUmlMetamodel();
    createRdbmsMetamodel();
  });

  it('should record and lookup traces', () => {
    const trace = new TraceModel();
    const umlFactory = umlPackage.getEFactoryInstance();
    const rdbmsFactory = rdbmsPackage.getEFactoryInstance();

    const source = umlFactory.create(packageClass);
    const target = rdbmsFactory.create(schemaClass);

    trace.addTrace(source, target, 'PackageToSchema');

    expect(trace.findTarget(source, 'PackageToSchema')).toBe(target);
    expect(trace.findSource(target, 'PackageToSchema')).toBe(source);
    expect(trace.size).toBe(1);
  });

  it('should return null for missing traces', () => {
    const trace = new TraceModel();
    const umlFactory = umlPackage.getEFactoryInstance();
    const source = umlFactory.create(packageClass);

    expect(trace.findTarget(source, 'NonExistent')).toBeNull();
  });

  it('should support relation lookup by bindings', () => {
    const trace = new TraceModel();
    const umlFactory = umlPackage.getEFactoryInstance();
    const rdbmsFactory = rdbmsPackage.getEFactoryInstance();

    const p = umlFactory.create(packageClass);
    const s = rdbmsFactory.create(schemaClass);

    trace.addEntry({
      ruleName: 'PackageToSchema',
      sourceObject: p,
      targetObject: s,
      sourceBindings: { p, pn: 'myPkg' },
      targetBindings: { s, sn: 'myPkg' },
    });

    const found = trace.lookupRelation('PackageToSchema', [p, 'myPkg']);
    expect(found).not.toBeNull();
    expect(found!.s).toBe(s);
  });
});

// ============================================================
// ExecutionDiagnostic Tests
// ============================================================
describe('ExecutionDiagnostic', () => {
  it('should start OK', () => {
    const diag = new ExecutionDiagnostic();
    expect(diag.isOk()).toBe(true);
    expect(diag.getSeverity()).toBe(DiagnosticSeverity.OK);
  });

  it('should track errors', () => {
    const diag = new ExecutionDiagnostic();
    diag.error('Something failed', 'TestRule');
    expect(diag.isOk()).toBe(false);
    expect(diag.hasErrors()).toBe(true);
    expect(diag.getSeverity()).toBe(DiagnosticSeverity.ERROR);
    expect(diag.getEntries()).toHaveLength(1);
  });

  it('should track mixed severities', () => {
    const diag = new ExecutionDiagnostic();
    diag.info('Info');
    diag.warn('Warning');
    expect(diag.isOk()).toBe(true);
    expect(diag.getSeverity()).toBe(DiagnosticSeverity.WARNING);
  });
});
