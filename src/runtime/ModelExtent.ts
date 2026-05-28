import type { EObject, EClass } from 'emfts';

/**
 * Container for EObjects in a transformation — like QVTo BasicModelExtent.
 * Provides type-indexed access for efficient pattern matching.
 */
export class ModelExtent {
  private readonly elements: EObject[] = [];
  private typeIndex: Map<EClass, EObject[]> | null = null;

  constructor(initial?: EObject[]) {
    if (initial) {
      this.elements.push(...initial);
    }
  }

  /** Add an element to the extent. */
  add(element: EObject): void {
    this.elements.push(element);
    this.typeIndex = null; // invalidate cache
  }

  /** Get all elements (read-only view). */
  getContents(): readonly EObject[] {
    return this.elements;
  }

  /** Replace all elements. */
  setContents(elements: EObject[]): void {
    this.elements.length = 0;
    this.elements.push(...elements);
    this.typeIndex = null;
  }

  /**
   * Get all objects whose eClass is the given class or a subtype.
   * Uses isSuperTypeOf for type-compatible matching.
   */
  objectsOfType(eClass: EClass): EObject[] {
    return this.elements.filter(obj => {
      const objClass = obj.eClass();
      return objClass === eClass || eClass.isSuperTypeOf(objClass);
    });
  }

  /** Get all objects of the exact given class. */
  objectsOfExactType(eClass: EClass): EObject[] {
    if (!this.typeIndex) {
      this.buildTypeIndex();
    }
    return this.typeIndex!.get(eClass) ?? [];
  }

  private buildTypeIndex(): void {
    this.typeIndex = new Map();
    for (const obj of this.elements) {
      const cls = obj.eClass();
      let list = this.typeIndex.get(cls);
      if (!list) {
        list = [];
        this.typeIndex.set(cls, list);
      }
      list.push(obj);
    }
  }

  /** Number of elements. */
  get size(): number {
    return this.elements.length;
  }
}
