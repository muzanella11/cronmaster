const fs = require("fs");
const path = require("path");

const rootPackageJson = path.join(__dirname, "../package.json");

const packageData = require(rootPackageJson);

const {devDependencies, scripts, ...packageJsonForDist} = packageData;

const distPath = path.join(__dirname, "../dist");

if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, {recursive: true});
}

fs.writeFileSync(path.join(distPath, "package.json"), JSON.stringify(packageJsonForDist, null, 2));

console.log("✅ package.json prepared in dist/");
