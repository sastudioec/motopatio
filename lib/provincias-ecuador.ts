/**
 * Provincias del Ecuador con sus ciudades principales.
 * Fuente: Division politico-administrativa del Ecuador.
 * "Otra" al final por si la ciudad no aparece en la lista.
 */

export type Provincia = {
  nombre: string
  ciudades: string[]
}

export const PROVINCIAS_ECUADOR: Provincia[] = [
  { nombre: 'Azuay', ciudades: ['Cuenca', 'Gualaceo', 'Paute', 'Sigsig', 'Chordeleg', 'Nabon', 'Santa Isabel', 'Giron', 'Otra'] },
  { nombre: 'Bolivar', ciudades: ['Guaranda', 'San Miguel', 'Chillanes', 'Caluma', 'Echeandia', 'Las Naves', 'Otra'] },
  { nombre: 'Cañar', ciudades: ['Azogues', 'Cañar', 'La Troncal', 'Biblian', 'Deleg', 'El Tambo', 'Suscal', 'Otra'] },
  { nombre: 'Carchi', ciudades: ['Tulcan', 'San Gabriel', 'Mira', 'Huaca', 'Bolivar', 'El Angel', 'Otra'] },
  { nombre: 'Chimborazo', ciudades: ['Riobamba', 'Alausi', 'Guano', 'Chambo', 'Chunchi', 'Colta', 'Guamote', 'Penipe', 'Pallatanga', 'Otra'] },
  { nombre: 'Cotopaxi', ciudades: ['Latacunga', 'La Mana', 'Pujili', 'Salcedo', 'Saquisili', 'Sigchos', 'Pangua', 'Otra'] },
  { nombre: 'El Oro', ciudades: ['Machala', 'Pasaje', 'Santa Rosa', 'Huaquillas', 'Piñas', 'Zaruma', 'El Guabo', 'Arenillas', 'Balsas', 'Portovelo', 'Atahualpa', 'Chilla', 'Las Lajas', 'Marcabeli', 'Otra'] },
  { nombre: 'Esmeraldas', ciudades: ['Esmeraldas', 'Atacames', 'Quininde', 'Muisne', 'San Lorenzo', 'Eloy Alfaro', 'La Concordia', 'Rio Verde', 'Otra'] },
  { nombre: 'Galapagos', ciudades: ['Puerto Ayora (Santa Cruz)', 'Puerto Baquerizo Moreno (San Cristobal)', 'Puerto Villamil (Isabela)', 'Otra'] },
  { nombre: 'Guayas', ciudades: ['Guayaquil', 'Daule', 'Duran', 'Milagro', 'Playas', 'Samborondon', 'Naranjal', 'El Triunfo', 'Yaguachi', 'Naranjito', 'Balzar', 'Colimes', 'Salitre', 'Palestina', 'Simon Bolivar', 'Pedro Carbo', 'Lomas de Sargentillo', 'Nobol', 'Balao', 'Isidro Ayora', 'General Villamil', 'Crnel. Marcelino Maridueña', 'Santa Lucia', 'Otra'] },
  { nombre: 'Imbabura', ciudades: ['Ibarra', 'Otavalo', 'Cotacachi', 'Atuntaqui (Antonio Ante)', 'Urcuqui', 'Pimampiro', 'Otra'] },
  { nombre: 'Loja', ciudades: ['Loja', 'Catamayo', 'Cariamanga', 'Celica', 'Macara', 'Saraguro', 'Gonzanama', 'Calvas', 'Zapotillo', 'Paltas', 'Chaguarpamba', 'Espindola', 'Olmedo', 'Pindal', 'Puyango', 'Quilanga', 'Sozoranga', 'Otra'] },
  { nombre: 'Los Rios', ciudades: ['Babahoyo', 'Quevedo', 'Ventanas', 'Valencia', 'Vinces', 'Buena Fe', 'Mocache', 'Montalvo', 'Pueblo Viejo', 'Palenque', 'Baba', 'Urdaneta', 'Quinsaloma', 'Otra'] },
  { nombre: 'Manabi', ciudades: ['Portoviejo', 'Manta', 'Chone', 'Jipijapa', 'Pedernales', 'Bahia de Caraquez', 'El Carmen', 'Montecristi', 'Calceta (Bolivar)', 'Jaramijo', 'Tosagua', 'Rocafuerte', 'Santa Ana', 'Paján', '24 de Mayo', 'Flavio Alfaro', 'Puerto Lopez', 'Jama', 'San Vicente', 'Junin', 'Olmedo', 'Pichincha', 'Sucre', 'Otra'] },
  { nombre: 'Morona Santiago', ciudades: ['Macas', 'Gualaquiza', 'Sucua', 'Mendez (Santiago)', 'Limon Indanza', 'Palora', 'Huamboya', 'Pablo Sexto', 'San Juan Bosco', 'Taisha', 'Logroño', 'Tiwintza', 'Otra'] },
  { nombre: 'Napo', ciudades: ['Tena', 'Archidona', 'El Chaco', 'Baeza (Quijos)', 'Carlos Julio Arosemena Tola', 'Otra'] },
  { nombre: 'Orellana', ciudades: ['Puerto Francisco de Orellana (El Coca)', 'Loreto', 'La Joya de los Sachas', 'Aguarico', 'Otra'] },
  { nombre: 'Pastaza', ciudades: ['Puyo', 'Shell', 'Mera', 'Arajuno', 'Santa Clara', 'Otra'] },
  { nombre: 'Pichincha', ciudades: ['Quito', 'Cayambe', 'Sangolqui (Rumiñahui)', 'Machachi', 'Tabacundo (Pedro Moncayo)', 'Cumbaya', 'Tumbaco', 'Puembo', 'Pifo', 'San Antonio de Pichincha', 'Calderon', 'Conocoto', 'San Miguel de los Bancos', 'Puerto Quito', 'Pedro Vicente Maldonado', 'Otra'] },
  { nombre: 'Santa Elena', ciudades: ['Santa Elena', 'Salinas', 'La Libertad', 'Otra'] },
  { nombre: 'Santo Domingo de los Tsachilas', ciudades: ['Santo Domingo', 'La Concordia', 'Otra'] },
  { nombre: 'Sucumbios', ciudades: ['Nueva Loja (Lago Agrio)', 'Shushufindi', 'Cascales', 'Gonzalo Pizarro', 'Cuyabeno', 'Putumayo', 'Sucumbios', 'Otra'] },
  { nombre: 'Tungurahua', ciudades: ['Ambato', 'Baños', 'Pelileo', 'Pillaro', 'Cevallos', 'Mocha', 'Patate', 'Quero', 'Tisaleo', 'Otra'] },
  { nombre: 'Zamora Chinchipe', ciudades: ['Zamora', 'Yantzaza', 'Zumba (Chinchipe)', 'Paquisha', 'Palanda', 'Nangaritza', 'El Pangui', 'Yacuambi', 'Centinela del Condor', 'Otra'] },
  { nombre: 'Otra', ciudades: ['Otra'] },
]

/**
 * Devuelve las provincias ordenadas alfabeticamente, con "Otra" al final.
 */
export function getProvincias(): string[] {
  const nombres = PROVINCIAS_ECUADOR.map(p => p.nombre).filter(n => n !== 'Otra').sort()
  return [...nombres, 'Otra']
}

/**
 * Devuelve las ciudades de una provincia dada.
 */
export function getCiudadesByProvincia(provincia: string): string[] {
  const p = PROVINCIAS_ECUADOR.find(p => p.nombre === provincia)
  return p ? p.ciudades : ['Otra']
}
