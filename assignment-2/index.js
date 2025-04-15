const dgram = require("dgram");
const readline = require("readline");

function buildDNSQuery(domain) {
  const transactionId = Buffer.from([0x12, 0x34]);
  const flags = Buffer.from([0x01, 0x00]);
  const questions = Buffer.from([0x00, 0x01]);
  const answerRRs = Buffer.from([0x00, 0x00]);
  const authorityRRs = Buffer.from([0x00, 0x00]);
  const additionalRRs = Buffer.from([0x00, 0x00]);

  const qnameParts = domain.split(".");
  const qname = Buffer.concat(
    qnameParts
      .map((p) => Buffer.concat([Buffer.from([p.length]), Buffer.from(p)]))
      .concat([Buffer.from([0x00])])
  );

  const qtype = Buffer.from([0x00, 0x01]);
  const qclass = Buffer.from([0x00, 0x01]);

  const header = Buffer.concat([
    transactionId,
    flags,
    questions,
    answerRRs,
    authorityRRs,
    additionalRRs,
  ]);

  const question = Buffer.concat([qname, qtype, qclass]);

  return Buffer.concat([header, question]);
}
function resolveDNS(domain, cache) {
  const message = buildDNSQuery(domain);
  const client = dgram.createSocket("udp4");

  client.send(message, 53, "8.8.8.8", (err) => {
    if (err) throw err;
  });

  client.on("message", (msg) => {
    let offset = 12;
    while (msg[offset] !== 0) {
      offset += 1;
    }
    offset += 5;
    offset += 2;
    offset += 4;

    const ttl = msg.readUInt32BE(offset);
    offset += 4;

    offset += 2;

    const ip = `${msg[offset]}.${msg[offset + 1]}.${msg[offset + 2]}.${
      msg[offset + 3]
    }`;

    console.log(`[DNS RESPONSE] ${domain} -> ${ip} (TTL: ${ttl}s)`);
    cache.add(domain, ip, ttl);
    client.close();
  });

  client.on("error", (err) => {
    console.error("Error:", err);
    client.close();
  });
}

class DNSCache {
  constructor() {
    this.cache = new Map();
  }

  add(domain, ip, ttl) {
    this.cache.set(domain, { ip, ttl, timestamp: Date.now() });
  }

  get(domain) {
    const record = this.cache.get(domain);
    if (record) {
      const { ip, ttl, timestamp } = record;
      const currentTime = Date.now();
      const elapsed = (currentTime - timestamp) / 1000;
      if (elapsed < ttl) {
        return { ip, ttl };
      } else {
        console.log(`[CACHE EXPIRED] ${domain} -> ${ip}`);
        this.cache.delete(domain);
        return null;
      }
    }
  }
}

class DNSResolver {
  constructor() {
    this.cache = new DNSCache();
  }

  printCache() {
    const now = Date.now();

    if (this.cache.size === 0) {
      console.log("DNS Cache is empty.");
      return;
    }

    console.log("DNS Cache:");
    for (const [domain, { ip, ttl, timestamp }] of this.cache.cache.entries()) {
      const age = (now - timestamp) / 1000;
      const timeLeft = Math.max(0, Math.floor(ttl - age));

      console.log(`→ ${domain}: IP=${ip}, TTL=${ttl}s, Time Left=${timeLeft}s`);
    }
  }
  resolve(domain) {
    const cachedIP = this.cache.get(domain);
    if (cachedIP) {
      console.log(
        `[CACHE HIT] ${domain} -> ${cachedIP.ip} (TTL: ${cachedIP.ttl}s)`
      );
      return;
    }
    resolveDNS(domain, this.cache);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function main() {
  const resolver = new DNSResolver();

  function getDomainInput() {
    rl.question("\nEnter a domain to resolve : ", async (domain) => {
      if (domain === "exit") {
        console.log("Exiting...");
        rl.close();
      } else if (domain === "ls") {
        resolver.printCache();
        getDomainInput();
      } else {
        resolver.resolve(domain);
        await sleep(200);
        getDomainInput();
      }
    });
  }

  getDomainInput();
}

main();
