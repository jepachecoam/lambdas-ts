#!/bin/bash

LAMBDA_DIR="src/lambdas"

# Verificar si hay carpetas en el directorio
FOLDERS=("$LAMBDA_DIR"/*/)
if [ ${#FOLDERS[@]} -eq 0 ]; then
  echo "No se encontraron carpetas en $LAMBDA_DIR"
  exit 1
fi

while true; do
  echo "Selecciona la carpeta que quieres compilar:"
  i=1
  declare -A OPTIONS
  for folder in "${FOLDERS[@]}"; do
    name=$(basename "$folder")
    OPTIONS[$i]="$folder"
    echo "  $i) $name"
    ((i++))
  done

  echo "  0) Cancelar / Atrás"
  read -p "Ingresa el número de la carpeta: " choice

  if [[ "$choice" == "0" ]]; then
    echo "Operación cancelada."
    exit 0
  elif [[ -n "${OPTIONS[$choice]}" ]]; then
    FOLDER_PATH="${OPTIONS[$choice]}"
    FOLDER=$(basename "$FOLDER_PATH")
    break
  else
    echo "Opción inválida. Intenta de nuevo."
  fi
done

echo "Compilando la Lambda '$FOLDER' con ncc..."

npx ncc build "$FOLDER_PATH/index.ts"

if [ $? -ne 0 ]; then
  echo "❌ Hubo un error durante la compilación."
  exit 1
fi

echo "✅ Compilación exitosa."
