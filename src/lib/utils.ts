import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDuration = (duration: number) => { // Formatea la duración del video en formato de hora:minutos:segundos
  const seconds = Math.floor((duration % 60000) / 1000)
  const minutes = Math.floor(duration / 60000)
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

export const snakeCaseToTitle = (str: string) => {
  return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) // Reemplaza los guiones bajos por espacios y convierte la primera letra de cada palabra en mayúscula.
}
