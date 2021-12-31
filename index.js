require('dotenv').config()

const postgres = require('postgres');
const express = require('express');
const app = express();

const port = process.env.PORT || 5252;
const sql = postgres(`postgres://${process.env.DB_USER || 'bitburner'}:${process.env.DB_PASS}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || bitburner}`);
const secret = process.env.SECRET;

if (!secret) {
	console.error('No secret was provided in .env!');
	process.exit(1);
}

app.use((req, res, next) => {
	res = res.setHeader('Access-Control-Allow-Origin', '*');
	next();
});

app.get('/bitburner', async (req, res) => {
	if (req.query.secret !== secret) {
		return res.send('403');
	}
	if (!req.query.processes || !req.query.hacking || !req.query.weakening || !req.query.growing) {
		return res.send('401');
	}

	await sql`
		INSERT INTO stats VALUES (${new Date()}, ${req.query.processes}, ${req.query.hacking}, ${req.query.weakening}, ${req.query.growing});
	`;
	
	res.send('200');
});

app.get('/bitburner/servers', async (req, res) => {
	if (req.query.secret !== secret) {
		return res.send('403');
	}
	if (!req.query.known || !req.query.rooted || !req.query.owned || !req.query.profitable) {
		return res.send('401');
	}

	await sql`
		INSERT INTO servers VALUES (${new Date()}, ${req.query.known}, ${req.query.rooted}, ${req.query.owned}, ${req.query.profitable});
	`;
	
	res.send('200');
});

app.get('/bitburner/boughtserver', async (req, res) => {
	if (req.query.secret !== secret) {
		return res.send('403');
	}
	if (!req.query.hostname || !req.query.ram) {
		return res.send('401');
	}

	await sql`
		DELETE FROM boughtservers WHERE hostname = ${req.query.hostname};
		INSERT INTO boughtservers VALUES (${req.query.hostname}, ${req.query.ram});
	`;
	
	res.send('200');
});

app.get('/bitburner/rmserver', async (req, res) => {
	if (req.query.secret !== secret) {
		return res.send('403');
	}
	if (!req.query.hostname) {
		return res.send('401');
	}

	await sql`
		DELETE FROM boughtservers WHERE hostname = ${req.query.hostname}
	`;
	
	res.send('200');
});

app.get('/bitburner/money', async (req, res) => {
	if (req.query.secret !== secret) {
		return res.send('403');
	}
	if (!req.query.money) {
		return res.send('401');
	}

	await sql`
		INSERT INTO money VALUES (${new Date()}, ${req.query.money});
	`;
	
	res.send('200');
});

setInterval(() => {
	sql`
		DELETE FROM servers WHERE time <= ${new Date(Date.now() - 1000 * 60 * 30)};
	`;
	sql`
		DELETE FROM stats WHERE time <= ${new Date(Date.now() - 1000 * 60 * 30)};
	`;
	sql`
		DELETE FROM money WHERE time <= ${new Date(Date.now() - 1000 * 60 * 60 * 3)};
	`;
}, 1000 * 30);

(async () => {
	await sql`
		CREATE TABLE IF NOT EXISTS stats (
		    time timestamp,
		    processes int,
		    hacking int,
		    weakening int,
		    growing int
		)
	`;
	await sql`
		CREATE TABLE IF NOT EXISTS servers (
		    time timestamp,
		    known int,
		    rooted int,
		    owned int,
		    profitable int
		)
	`;
	await sql`
		CREATE TABLE IF NOT EXISTS boughtservers (
			hostname text,
			ram int
		)
	`;
	await sql`
		CREATE TABLE IF NOT EXISTS money (
		    time timestamp,
		    money real
		)
	`;

	app.listen(port, () => {
		console.log(`listening ${port}`);
	});
})();
