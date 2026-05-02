# Logos de marcas — paths esperados por el blog

Cada archivo debe ser PNG con fondo transparente (ideal) o fondo blanco. Cuadrado o cercano. Mínimo 200x200px. Se renderiza en un cuadro de 64x64px con padding, así que un logo demasiado fino se va a ver chico — tipografía + isotipo funciona mejor.

Si un archivo no existe, el componente muestra la inicial de la marca como fallback automático.

| Marca    | Path esperado                       |
|----------|-------------------------------------|
| Honda    | /public/blog/logos/honda.png        |
| Yamaha   | /public/blog/logos/yamaha.png       |
| Suzuki   | /public/blog/logos/suzuki.png       |
| Bajaj    | /public/blog/logos/bajaj.png        |
| TVS      | /public/blog/logos/tvs.png          |
| Shineray | /public/blog/logos/shineray.png     |
| Daytona  | /public/blog/logos/daytona.png      |
| Loncin   | /public/blog/logos/loncin.png       |
| IGM      | /public/blog/logos/igm.png          |
| Motor1   | /public/blog/logos/motor1.png       |
| Tuko     | /public/blog/logos/tuko.png         |

Para ver cambios sin rebuild, basta `pm2 restart motopatio` (las imágenes en /public se sirven directo, no requieren rebuild de Next).
