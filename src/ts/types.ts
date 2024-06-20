type Constructor<Type = {}> = new (...args: any[]) => Type;
type AbstractConstructor<Type = {}> = abstract new (...args: any[]) => Type;
type Elementable<Type> = Constructor<AppElement<Type>>
type PointableElement<Type> = Constructor<PointedElement<Type>>
type GridableElement<Type> = Constructor<GridElement<Type>>