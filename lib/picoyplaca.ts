// Reglas Pico y Placa Quito 2026
// Horario: 05:00-09:00 y 16:00-20:00, de lunes a viernes
// Solo aplica en Quito

const DIAS = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']

// Último dígito de la placa → día que NO puede circular (1-5 = Lun-Vie)
const DIA_RESTRINGIDO: Record<string, number> = {
  '1': 1, '2': 1,   // Lunes
  '3': 2, '4': 2,   // Martes
  '5': 3, '6': 3,   // Miercoles
  '7': 4, '8': 4,   // Jueves
  '9': 5, '0': 5,   // Viernes
}

export function getUltimoDigito(placa: string): string | null {
  if (!placa) return null
  const match = placa.match(/(\d)(?!.*\d)/) // último dígito
  return match ? match[1] : null
}

export interface PicoYPlacaInfo {
  aplica: boolean           // ¿aplica en esta ciudad?
  diaRestringido: number | null   // 1=lunes, 5=viernes, null=no aplica
  diaNombre: string | null
  ultimoDigito: string | null
  horarios: string[]
  descripcion: string
}

export function calcularPicoYPlaca(placa: string, ciudad: string): PicoYPlacaInfo {
  const esQuito = ciudad?.toLowerCase().trim() === 'quito'

  if (!esQuito) {
    return {
      aplica: false,
      diaRestringido: null,
      diaNombre: null,
      ultimoDigito: null,
      horarios: [],
      descripcion: 'No aplica Pico y Placa en ' + (ciudad || 'esta ciudad'),
    }
  }

  const ultimo = getUltimoDigito(placa)
  if (!ultimo) {
    return {
      aplica: true,
      diaRestringido: null,
      diaNombre: null,
      ultimoDigito: null,
      horarios: ['05:00 - 09:00', '16:00 - 20:00'],
      descripcion: 'Placa no valida para calcular Pico y Placa',
    }
  }

  const dia = DIA_RESTRINGIDO[ultimo]
  return {
    aplica: true,
    diaRestringido: dia,
    diaNombre: DIAS[dia],
    ultimoDigito: ultimo,
    horarios: ['05:00 - 09:00', '16:00 - 20:00'],
    descripcion: 'No circula los ' + DIAS[dia] + 's en horario pico',
  }
}

// Helpers para filtros: ¿esta moto puedo usarla el día X? (1=lunes..5=viernes, 0 o 6 = libre)
export function puedeCircularElDia(placa: string, ciudad: string, dia: number): boolean {
  const info = calcularPicoYPlaca(placa, ciudad)
  if (!info.aplica) return true           // fuera de Quito circula siempre
  if (dia === 0 || dia === 6) return true  // fin de semana libre
  return info.diaRestringido !== dia
}
