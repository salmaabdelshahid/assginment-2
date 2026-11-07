const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const os = require('os');
const zlib = require('zlib');
const { pipeline } = require('stream');
const http = require('http');

const filePath = path.join(__dirname, 'users.json');

const myEmitter = new EventEmitter();
myEmitter.on('start', () => {
    console.log('Welcome event triggered!');
});

const authEmitter = new EventEmitter();
authEmitter.on('login', (username) => {
    console.log(`User logged in: ${username}`);
});

function fileAndDirectory(params) {
    const fileName = __filename;
    const directory = __dirname;
    console.log(`File : ${fileName} , Dir : ${directory}`);
}

function getFileName(filePath) {
    return path.basename(filePath);
}

function buildPathFromObject(pathObj) {
    return path.format(pathObj);
}

function getFileExtension(filePath) {
    return path.extname(filePath);
}

function parsePathNameAndExt(filePath) {
    const parsed = path.parse(filePath);
    return {
        Name: parsed.name,
        Ext: parsed.ext
    };
}

function isAbsolutePath(filePath) {
    return path.isAbsolute(filePath);
}

function joinSegments(...segments) {
    return path.join(...segments);
}

function resolveToAbsolute(relativePath) {
    return path.resolve(relativePath);
}

function joinTwoPaths(path1, path2) {
    return path.join(path1, path2);
}

function deleteFileAsync(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Error deleting file: ${err.message}`);
            return;
        }
        const fileName = path.basename(filePath);
        console.log(`The ${fileName} is deleted.`);
    });
}

function createFolderSync(folderPath) {
    try {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        console.log("Success");
    } catch (err) {
        
    }
}

function readFileSyncExample(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(content);
    } catch (err) {
        console.error(`Error reading file: ${err.message}`);
    }
}

function writeFileAsync(filePath, content) {
    fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
            console.error(`Error writing file: ${err.message}`);
            return;
        }
        console.log('File written successfully.');
    });
}

function checkExists(targetPath) {
    return fs.existsSync(targetPath);
}

function getOSInfo() {
    return {
        Platform: os.platform(),
        Arch: os.arch()
    };
}

function readFileInChunks(filePath) {
    const readableStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    readableStream.on('data', (chunk) => {
        console.log('--- Received Chunk ---');
        console.log(chunk);
    });

    readableStream.on('error', (err) => {
        console.error(`Stream error: ${err.message}`);
    });
}

function copyFileWithStreams(sourcePath, destPath) {
    const readableStream = fs.createReadStream(sourcePath);
    const writableStream = fs.createWriteStream(destPath);

    readableStream.pipe(writableStream);

    writableStream.on('finish', () => {
        console.log('File copied using streams');
    });

    readableStream.on('error', (err) => console.error(`Read error: ${err.message}`));
    writableStream.on('error', (err) => console.error(`Write error: ${err.message}`));
}

function compressFilePipeline(sourcePath, destPath) {
    const source = fs.createReadStream(sourcePath);
    const gzip = zlib.createGzip();
    const destination = fs.createWriteStream(destPath);

    pipeline(source, gzip, destination, (err) => {
        if (err) {
            console.error(`Pipeline failed: ${err.message}`);
        } else {
            console.log('Pipeline execution completed successfully. File compressed.');
        }
    });
}

const readUsers = () => {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return data ? JSON.parse(data) : [];
};

const writeUsers = (users) => {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
};

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    let body = '';
    req.on('data', chunk => {
        body += chunk;
    });

    req.on('end', () => {
        let data = {};
        if (body) {
            try {
                data = JSON.parse(body);
            } catch (e) {
                data = {};
            }
        }

        res.setHeader('Content-Type', 'application/json');

        if (pathname === '/user' && method === 'GET') {
            const users = readUsers();
            res.statusCode = 200;
            res.end(JSON.stringify(users));
        } else if (pathname === '/user' && method === 'POST') {
            const { name, age, email } = data;
            const users = readUsers();

            const emailExists = users.find(u => u.email === email);
            if (emailExists) {
                res.statusCode = 200;
                return res.end(JSON.stringify({ message: "Email already exists." }));
            }

            const newUser = {
                id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
                name,
                age,
                email
            };

            users.push(newUser);
            writeUsers(users);
            res.statusCode = 200;
            res.end(JSON.stringify({ message: "User added successfully." }));
        } else if (pathname.startsWith('/user/')) {
            const idStr = pathname.split('/')[2];
            const userId = parseInt(idStr);
            const users = readUsers();
            const userIndex = users.findIndex(u => u.id === userId);

            if (userIndex === -1) {
                res.statusCode = 200;
                return res.end(JSON.stringify({ message: "User ID not found." }));
            }

            if (method === 'PATCH') {
                const { name, age, email } = data;
                let updatedField = "";

                if (name) { users[userIndex].name = name; updatedField = "name"; }
                if (age) { users[userIndex].age = age; updatedField = "age"; }
                if (email) { users[userIndex].email = email; updatedField = "email"; }

                writeUsers(users);
                res.statusCode = 200;
                res.end(JSON.stringify({ message: `User ${updatedField} updated successfully.` }));
            } else if (method === 'DELETE') {
                const updatedUsers = users.filter(u => u.id !== userId);
                writeUsers(updatedUsers);
                res.statusCode = 200;
                res.end(JSON.stringify({ message: "User deleted successfully." }));
            } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ message: "Not Found" }));
            }
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ message: "Not Found" }));
        }
    });
});

server.listen(3000, () => {});