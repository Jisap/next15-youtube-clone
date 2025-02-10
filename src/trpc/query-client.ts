import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';
//import superjson from 'superjson';

export function makeQueryClient() {                       // crea y configura una instancia de QueryClient
  return new QueryClient({
    defaultOptions: {                                     // Configura las opciones por defecto para QueryClient
      queries: {
        staleTime: 30 * 1000,                             // Establece el tiempo en milisegundos (30 segundos) que una query se considera "fresca" antes de que se marque como "stale" (obsoleta).  
      },
      dehydrate: {                                        // Define opciones para la "deshidratación" de los datos (extraer el estado de una query).
        // serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>                  // Define una función que determina si una consulta debe ser deshidratada 
          defaultShouldDehydrateQuery(query) ||           // Es una función que determina si una query debe ser deshidratada (serializada) por defecto.
          query.state.status === 'pending',               // si la consulta está pendiente, también la deshidrata.
      },
      hydrate: {                                          // Configura cómo se deben hidratar (deserializar) las queries (convertir el estado de una query en un formato que se pueda enviar). 
        // deserializeData: superjson.deserialize,
      },
    },
  });
}