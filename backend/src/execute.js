import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

const TIMEOUT = 5000; // 5 seconds execution timeout

export const executeCode = async (language, code) => {
    const jobId = Math.random().toString(36).substr(2, 9);
    const filename = `${jobId}`;
    let filePath = '';
    let output = '';

    try {
        switch (language) {
            case 'java':
                // Extract class name to support custom class names like 'Factorial'
                const classMatch = code.match(/class\s+([A-Za-z0-9_]+)/);
                let className = 'Main';
                let javaCode = code;

                if (classMatch) {
                    className = classMatch[1];
                    filePath = path.join(TEMP_DIR, `${className}.java`);
                } else {
                    // No class defined? Wrap snippet in Main class
                    javaCode = `
public class Main {
    public static void main(String[] args) {
        ${code}
    }
}
`;
                    filePath = path.join(TEMP_DIR, 'Main.java');
                }

                await writeFileAsync(filePath, javaCode);

                // Compile
                await execAsync(`javac "${filePath}"`, { timeout: TIMEOUT });

                // Run (use the detected class name)
                const javaResult = await execAsync(`java -cp "${TEMP_DIR}" ${className}`, { timeout: TIMEOUT });
                output = javaResult.stdout || javaResult.stderr;

                // Cleanup .class file
                try { await unlinkAsync(path.join(TEMP_DIR, `${className}.class`)); } catch (e) { }
                break;

            case 'cpp':
                filePath = path.join(TEMP_DIR, `${filename}.cpp`);
                const outPath = path.join(TEMP_DIR, `${filename}.out`); // or .exe on windows
                await writeFileAsync(filePath, code);

                // Compile
                await execAsync(`g++ "${filePath}" -o "${outPath}"`, { timeout: TIMEOUT });
                // Execute
                const cppResult = await execAsync(`"${outPath}"`, { timeout: TIMEOUT });
                output = cppResult.stdout || cppResult.stderr;

                // Cleanup binary
                try { await unlinkAsync(outPath); } catch (e) { }
                break;

            case 'go':
                filePath = path.join(TEMP_DIR, `${filename}.go`);
                await writeFileAsync(filePath, code);

                // Go run compiles and runs in one step (slower but easier)
                const goResult = await execAsync(`go run "${filePath}"`, { timeout: TIMEOUT });
                output = goResult.stdout || goResult.stderr;
                break;

            default:
                throw new Error(`Unsupported language: ${language}`);
        }
    } catch (error) {
        // Return error message if execution fails (compilation error, runtime error, timeout)
        output = error.stderr || error.stdout || error.message;

        // Check for timeout
        if (error.killed) {
            output = 'Error: Execution timed out (limit: 5 seconds)';
        }
    } finally {
        // Cleanup source file
        if (filePath) {
            try { await unlinkAsync(filePath); } catch (e) { }
        }
    }

    return output;
};
