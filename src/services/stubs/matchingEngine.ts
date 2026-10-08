import type { GeometricEngine } from '../../domain/types'
import { searchEngineStub } from './searchEngine'
import { surrogateEngineStub } from './surrogateEngine'
/** StubId: matching-engine. Composed from the search half and the surrogate half so each can be built independently. */
export const engineStub: GeometricEngine = { ...searchEngineStub, ...surrogateEngineStub }
