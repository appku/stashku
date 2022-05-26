import http from 'http';

const server = http.createServer((req, res) => {
    console.log(req.protocol + '://' + req.rawHeaders + req.url);
    res.writeHead(200);
    res.end('Hello, World!');
});
server.listen(8080);