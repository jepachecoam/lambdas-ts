#!/bin/bash

read -p "Ingresa el nombre de la carpeta que quieres compilar: " FOLDER

if [ ! -d "src/use-cases/$FOLDER" ]; then
  echo "La carpeta $FOLDER no existe."
  exit 1
fi

echo "Compilando el código de $FOLDER..."
npx tsc src/use-cases/$FOLDER/index.ts --outDir build

if [ $? -ne 0 ]; then
  echo "Hubo un error durante la compilación."
  exit 1
fi

echo "Compilación exitosa."