// Scans source files to detect npm dependencies from import statements
export function detectDependencies(files) {
    const deps = {};
    if (!files) return deps;

    const allCode = Object.values(files).join("\n");
    const filePaths = Object.keys(files);

    const isLocalFileOrFolder = (pkgName) => {
        const name = pkgName.startsWith("@/") ? pkgName.substring(2) : pkgName;
        return (
            pkgName.startsWith("@/") ||
            pkgName === "@" ||
            filePaths.some(p => 
                p === `/${name}` || 
                p.startsWith(`/${name}/`) || 
                p.replace(/\.[^/.]+$/, "") === `/${name}`
            )
        );
    };

    const importRegex = /from\s+['"]([^./][^'"]*)['"]/g;
    let match;
    while ((match = importRegex.exec(allCode)) !== null) {
        const rawImport = match[1];

        // Scoped packages like @scope/package, normal packages like package
        const pkg = rawImport.startsWith("@") && !rawImport.startsWith("@/")
            ? rawImport.split("/").slice(0, 2).join("/")
            : rawImport.split("/")[0];

        // Skip react (included in template), react-dom, and local modules
        if (pkg !== "react" && pkg !== "react-dom" && !isLocalFileOrFolder(pkg)) {
            deps[pkg] = "latest";
        }
    }
    return deps;
}

// Generated projects store their entry point at /App.js, while Sandpack's
// React template mounts /src/App.js. Keep project paths stable outside preview.
export function toSandpackFiles(files) {
    const mapped = {};
    for (const [path, value] of Object.entries(files || {})) {
        const previewPath = path.startsWith("/src/") ? path : `/src${path.startsWith("/") ? path : `/${path}`}`;
        mapped[previewPath] = value;
    }
    return mapped;
}

export function fromSandpackFiles(files, projectFiles = {}) {
    const mapped = {};
    for (const [path, value] of Object.entries(files || {})) {
        const projectPath = path.startsWith("/src/") ? path.slice(4) : path;
        if (Object.prototype.hasOwnProperty.call(projectFiles, projectPath)) {
        mapped[projectPath] = typeof value === "string" ? value : value?.code ?? "";
        }
    }
    return mapped;
}
