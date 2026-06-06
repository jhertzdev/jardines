const fs = require('fs');
const path = require('path');
const packageJson = require('./package.json');

// 1. Ruta base donde Quasar empaqueta la aplicación
const carpetaPackaged = path.join(__dirname, 'dist', 'electron', 'Packaged');

try {
    // 2. Leer el contenido de la carpeta 'Packaged' para encontrar la subcarpeta de la app
    if (fs.existsSync(carpetaPackaged)) {
        const contenidos = fs.readdirSync(carpetaPackaged);
        
        // Buscamos la carpeta que empiece por el nombre de tu ejecutable/app (ej: 'Jardines')
        // Cambia 'Jardines' por las primeras letras del nombre de tu carpeta si es diferente
        const carpetaApp = contenidos.find(nombre => nombre.startsWith('Jardines') && fs.lstatSync(path.join(carpetaPackaged, nombre)).isDirectory());

        if (carpetaApp) {
            const rutaDestinoTxt = path.join(carpetaPackaged, carpetaApp, 'app-version.txt');
            
            fs.writeFileSync(rutaDestinoTxt, `v${packageJson.version}`, 'utf8');
            
            console.log(`\x1b[32m%s\x1b[0m`, `✓ Archivo app-version.txt creado con éxito:`);
            console.log(`  -> ${rutaDestinoTxt}`);

            const srcUpdatePs1 = path.join(__dirname, 'src-electron', 'update.ps1');
            const dstUpdatePs1 = path.join(carpetaPackaged, carpetaApp, 'update.ps1');
            fs.copyFileSync(srcUpdatePs1, dstUpdatePs1);
            console.log(`\x1b[32m%s\x1b[0m`, `✓ Archivo update.ps1 copiado con éxito:`);
            console.log(`  -> ${dstUpdatePs1}`);

            const srcLogo = path.join(__dirname, 'public', 'img', 'logo-cementerio.png');
            const dstLogo = path.join(carpetaPackaged, carpetaApp, 'logo-cementerio.png');
            fs.copyFileSync(srcLogo, dstLogo);
            console.log(`\x1b[32m%s\x1b[0m`, `✓ Logo copiado con éxito:`);
            console.log(`  -> ${dstLogo}`);
        } else {
            console.log(`\x1b[31m%s\x1b[0m`, `❌ Error: No se encontró la carpeta empaquetada dentro de 'Packaged/'.`);
        }
    } else {
        console.log(`\x1b[31m%s\x1b[0m`, `❌ Error: La carpeta 'dist/electron/Packaged' aún no existe. Asegúrate de compilar primero.`);
    }
} catch (error) {
    console.error(`❌ Ocurrió un error al generar el archivo de versión:`, error);
}