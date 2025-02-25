#!/bin/bash

read -p "Ingresa el nombre de la carpeta que quieres compilar: " FOLDER

LAMBDA_PATH="src/lambdas/$FOLDER"

if [ ! -d "$LAMBDA_PATH" ]; then
  echo "La carpeta $FOLDER no existe en src/lambdas/"
  exit 1
fi

echo "Compilando la Lambda $FOLDER con ncc..."

# Ejecutar ncc sin modificar la salida
npx ncc build "$LAMBDA_PATH/index.ts"

if [ $? -ne 0 ]; then
  echo "Hubo un error durante la compilación."
  exit 1
fi

echo "Compilación exitosa."
