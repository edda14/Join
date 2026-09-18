/** Static submission checks. Run with NODE_PATH set to the global npm module directory. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let functionsChecked = 0;
let largestFunction = 0;
let filesChecked = 0;

/** Reads a project source file. @param {string} file Absolute file path. @returns {string} Source text. */
function read(file) {
    return fs.readFileSync(file, 'utf8');
}

/** Enforces the file-size limit. @param {string} file Absolute file path. @returns {void} */
function checkFileLength(file) {
    assert(read(file).trimEnd().split('\n').length <= 400, `${file}: more than 400 lines`);
    filesChecked++;
}

/** Checks function size and named-function documentation. @param {Object} node AST node. @param {Object} source Parsed source file. @returns {void} */
function checkFunction(node, source) {
    const first = source.getLineAndCharacterOfPosition(node.getStart(source)).line;
    const last = source.getLineAndCharacterOfPosition(node.end).line;
    assert(last - first + 1 <= 14, `${source.fileName}:${first + 1}: function exceeds 14 lines`);
    largestFunction = Math.max(largestFunction, last - first + 1);
    functionsChecked++;
    if (ts.isFunctionDeclaration(node)) checkDocumentation(node, source);
}

/** Checks documented arguments and results. @param {Object} node Function declaration. @param {Object} source Parsed source file. @returns {void} */
function checkDocumentation(node, source) {
    const tags = node.jsDoc?.at(-1)?.tags || [];
    assert(node.jsDoc?.length, `${source.fileName}: ${node.name.text} has no JSDoc`);
    assert(tags.some(tag => ['returns', 'return'].includes(tag.tagName.text)), `${node.name.text}: missing return documentation`);
    node.parameters.forEach(parameter => {
        const name = ts.isIdentifier(parameter.name) ? parameter.name.text : 'options';
        assert(tags.some(tag => tag.tagName.text === 'param' && tag.name?.getText(source) === name), `${node.name.text}: missing @param ${name}`);
    });
}

/** Detects static markup embedded in JavaScript. @param {Object} node AST node. @param {Object} source Parsed source file. @returns {void} */
function checkMarkup(node, source) {
    const text = ts.isTemplateExpression(node) ? node.head.text : node.text;
    assert(!/^\s*<[a-z!/]/i.test(text), `${source.fileName}: static HTML belongs in an HTML template`);
}

/** Visits source nodes recursively. @param {Object} node AST node. @param {Object} source Parsed source file. @returns {void} */
function visit(node, source) {
    if (ts.isFunctionLike(node) && node.body) checkFunction(node, source);
    if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node)) checkMarkup(node, source);
    ts.forEachChild(node, child => visit(child, source));
}

/** Parses and checks one script. @param {string} file Absolute file path. @returns {void} */
function checkScript(file) {
    const content = read(file);
    new vm.Script(content, { filename: file });
    const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    visit(source, source);
}

/** Checks script paths and the inert templates needed by a page. @param {string} file Absolute HTML file path. @returns {void} */
function checkPage(file) {
    const html = read(file);
    const templates = new Set([...html.matchAll(/<template id="([^"]+)"/g)].map(match => match[1]));
    const scripts = [...html.matchAll(/src="\.\/js\/([^"?]+)(?:\?[^\"]*)?"/g)];
    scripts.forEach(match => {
        const script = path.join(root, 'js', match[1]);
        assert(fs.existsSync(script), `${file}: missing script ${script}`);
        [...read(script).matchAll(/renderHtmlTemplate\('([^']+)'/g)].forEach(template => {
            assert(templates.has(template[1]), `${file}: missing template ${template[1]}`);
        });
    });
    checkPageHandlers(html, scripts, path.basename(file) === 'board.html');
}

/** Checks existing inline event handlers. @param {string} html Page markup. @param {Array} scripts Loaded scripts. @param {boolean} includeTemplates Include Board templates. @returns {void} */
function checkPageHandlers(html, scripts, includeTemplates) {
    const names = new Set();
    scripts.forEach(match => {
        const source = ts.createSourceFile(match[1], read(path.join(root, 'js', match[1])), ts.ScriptTarget.Latest, true);
        source.statements.forEach(node => { if (node.name) names.add(node.name.text); });
    });
    const markup = includeTemplates ? html : html.replace(/<template\b[\s\S]*?<\/template>/g, '');
    [...markup.matchAll(/\bon[a-z]+="([^"]+)"/g)].forEach(match => {
        const handler = match[1].replace(/\{\{slot\d+\}\}/g, '0');
        visitHandler(ts.createSourceFile('handler', handler, ts.ScriptTarget.Latest, true), names);
    });
}

/** Checks global calls inside an inline handler. @param {Object} node Handler AST node. @param {Set<string>} names Available global functions. @returns {void} */
function visitHandler(node, names) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        assert(names.has(node.expression.text), `Missing event handler: ${node.expression.text}`);
    }
    ts.forEachChild(node, child => visitHandler(child, names));
}

for (const directory of ['js', 'css']) {
    fs.readdirSync(path.join(root, directory)).filter(file => /\.(js|css)$/.test(file)).forEach(file => {
        const absolute = path.join(root, directory, file);
        checkFileLength(absolute);
        if (directory === 'js') checkScript(absolute);
    });
}
fs.readdirSync(root).filter(file => file.endsWith('.html')).forEach(file => {
    const absolute = path.join(root, file);
    checkFileLength(absolute);
    checkPage(absolute);
});
console.log(`PASS: ${filesChecked} files, ${functionsChecked} functions, longest function ${largestFunction} lines.`);
console.log('PASS: syntax, JSDoc, script paths, template references and static HTML separation.');
