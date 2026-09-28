import bcrypt from 'bcryptjs';

export const cryptoEngine = {
  // Password Entropy & Strength
  calculatePasswordEntropy(password) {
    if (!password) return { entropy: 0, score: 0, label: 'Empty', crackTime: 'Instant' };
    
    let pool = 0;
    if (/[a-z]/.test(password)) pool += 26;
    if (/[A-Z]/.test(password)) pool += 26;
    if (/[0-9]/.test(password)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(password)) pool += 33;

    const entropy = Math.round(password.length * Math.log2(Math.max(pool, 1)));
    
    let score = 0;
    let label = 'Very Weak';
    let crackTime = '< 1 millisecond';

    if (entropy > 80) { score = 4; label = 'Very Strong'; crackTime = 'Centuries'; }
    else if (entropy > 60) { score = 3; label = 'Strong'; crackTime = 'Decades'; }
    else if (entropy > 40) { score = 2; label = 'Moderate'; crackTime = 'Months'; }
    else if (entropy > 25) { score = 1; label = 'Weak'; crackTime = 'Hours'; }

    return { entropy, score, label, pool, crackTime, length: password.length };
  },

  // Bcrypt Hasher
  async hashBcrypt(password, saltRounds = 10) {
    return bcrypt.hash(password, saltRounds);
  },

  async verifyBcrypt(password, hash) {
    return bcrypt.compare(password, hash);
  },

  // Hash SHA-256 and SHA-512 via Web Crypto
  async hashWebCrypto(text, algorithm = 'SHA-256') {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Pure JS MD5 Checksum
  md5(string) {
    function rotateLeft(lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
      const lX8 = (lX & 0x80000000);
      const lY8 = (lY & 0x80000000);
      const lX4 = (lX & 0x40000000);
      const lY4 = (lY & 0x40000000);
      const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      if (lX4 | lY4) {
        if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
      }
      return (lResult ^ lX8 ^ lY8);
    }
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return (y ^ (x | (~z))); }

    let x = [];
    let k, AA, BB, CC, DD, a, b, c, d;
    const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

    const utf8Str = unescape(encodeURIComponent(string));
    const strLen = utf8Str.length;
    const numWords = (((strLen + 8) >> 6) + 1) * 16;
    for (let i = 0; i < numWords; i++) x[i] = 0;
    for (let i = 0; i < strLen; i++) x[i >> 2] |= (utf8Str.charCodeAt(i) & 0xFF) << ((i % 4) * 8);
    x[strLen >> 2] |= 0x80 << ((strLen % 4) * 8);
    x[numWords - 2] = (strLen * 8) & 0xFFFFFFFF;
    x[numWords - 1] = Math.floor((strLen * 8) / 0x100000000);

    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
    for (k = 0; k < x.length; k += 16) {
      AA = a; BB = b; CC = c; DD = d;
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x[k + 0]), 0xD76AA478)); a = rotateLeft(a, S11); a = addUnsigned(a, b);
      d = addUnsigned(d, addUnsigned(addUnsigned(F(a, b, c), x[k + 1]), 0xE8C7B756)); d = rotateLeft(d, S12); d = addUnsigned(d, a);
      c = addUnsigned(c, addUnsigned(addUnsigned(F(d, a, b), x[k + 2]), 0x242070DB)); c = rotateLeft(c, S13); c = addUnsigned(c, d);
      b = addUnsigned(b, addUnsigned(addUnsigned(F(c, d, a), x[k + 3]), 0xC1BDCEEE)); b = rotateLeft(b, S14); b = addUnsigned(b, c);
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x[k + 4]), 0xF57C0FAF)); a = rotateLeft(a, S11); a = addUnsigned(a, b);
      d = addUnsigned(d, addUnsigned(addUnsigned(F(a, b, c), x[k + 5]), 0x4787C62A)); d = rotateLeft(d, S12); d = addUnsigned(d, a);
      c = addUnsigned(c, addUnsigned(addUnsigned(F(d, a, b), x[k + 6]), 0xA8304613)); c = rotateLeft(c, S13); c = addUnsigned(c, d);
      b = addUnsigned(b, addUnsigned(addUnsigned(F(c, d, a), x[k + 7]), 0xFD469501)); b = rotateLeft(b, S14); b = addUnsigned(b, c);
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x[k + 8]), 0x698098D8)); a = rotateLeft(a, S11); a = addUnsigned(a, b);
      d = addUnsigned(d, addUnsigned(addUnsigned(F(a, b, c), x[k + 9]), 0x8B44F7AF)); d = rotateLeft(d, S12); d = addUnsigned(d, a);
      c = addUnsigned(c, addUnsigned(addUnsigned(F(d, a, b), x[k + 10]), 0xFFFF5BB1)); c = rotateLeft(c, S13); c = addUnsigned(c, d);
      b = addUnsigned(b, addUnsigned(addUnsigned(F(c, d, a), x[k + 11]), 0x895CD7BE)); b = rotateLeft(b, S14); b = addUnsigned(b, c);
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x[k + 12]), 0x6B901122)); a = rotateLeft(a, S11); a = addUnsigned(a, b);
      d = addUnsigned(d, addUnsigned(addUnsigned(F(a, b, c), x[k + 13]), 0xFD987193)); d = rotateLeft(d, S12); d = addUnsigned(d, a);
      c = addUnsigned(c, addUnsigned(addUnsigned(F(d, a, b), x[k + 14]), 0xA679438E)); c = rotateLeft(c, S13); c = addUnsigned(c, d);
      b = addUnsigned(b, addUnsigned(addUnsigned(F(c, d, a), x[k + 15]), 0x49B40821)); b = rotateLeft(b, S14); b = addUnsigned(b, c);

      a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
    }
    const wordToHex = (lValue) => {
      let wordToHexValue = '', wordToHexValueTemp = '', lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        wordToHexValueTemp = '0' + lByte.toString(16);
        wordToHexValue += wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
      }
      return wordToHexValue;
    };
    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
  },

  // JWT Token Debugger
  decodeJWT(token) {
    if (!token || token.split('.').length !== 3) {
      throw new Error('Invalid JWT format. A valid token contains 3 parts separated by dots.');
    }
    const [headerB64, payloadB64, signature] = token.split('.');
    const b64Decode = (str) => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    };
    
    const header = JSON.parse(b64Decode(headerB64));
    const payload = JSON.parse(b64Decode(payloadB64));
    const isExpired = payload.exp ? (Date.now() >= payload.exp * 1000) : false;
    
    return {
      header,
      payload,
      signature,
      isExpired,
      issuedAt: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : null,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : null
    };
  },

  // IPv4 Subnet Calculator
  calculateSubnet(ip, cidr) {
    const cidrNum = parseInt(cidr, 10);
    if (isNaN(cidrNum) || cidrNum < 0 || cidrNum > 32) throw new Error('Invalid CIDR mask (0-32).');
    
    const ipParts = ip.split('.').map(Number);
    if (ipParts.length !== 4 || ipParts.some(n => isNaN(n) || n < 0 || n > 255)) {
      throw new Error('Invalid IPv4 address format (e.g. 192.168.1.1).');
    }

    const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const maskInt = cidrNum === 0 ? 0 : (~0 << (32 - cidrNum));
    const netInt = ipInt & maskInt;
    const bcastInt = netInt | (~maskInt);

    const intToIp = (num) => [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.');

    const totalHosts = Math.pow(2, 32 - cidrNum);
    const usableHosts = cidrNum >= 31 ? (cidrNum === 31 ? 2 : 1) : Math.max(0, totalHosts - 2);

    return {
      ip,
      cidr: `/${cidrNum}`,
      netmask: intToIp(maskInt),
      networkAddress: intToIp(netInt),
      broadcastAddress: intToIp(bcastInt),
      firstUsableHost: cidrNum >= 31 ? intToIp(netInt) : intToIp(netInt + 1),
      lastUsableHost: cidrNum >= 31 ? intToIp(bcastInt) : intToIp(bcastInt - 1),
      totalHosts: totalHosts.toLocaleString(),
      usableHosts: usableHosts.toLocaleString()
    };
  },

  // Text Diff Checker
  diffTexts(text1, text2) {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const max = Math.max(lines1.length, lines2.length);
    const diff = [];

    for (let i = 0; i < max; i++) {
      const l1 = lines1[i];
      const l2 = lines2[i];
      if (l1 === l2) {
        diff.push({ type: 'equal', line: l1 });
      } else {
        if (l1 !== undefined) diff.push({ type: 'removed', line: l1 });
        if (l2 !== undefined) diff.push({ type: 'added', line: l2 });
      }
    }
    return diff;
  },

  // HEX to RGB and HSL
  convertColor(hex) {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;

    // RGB to HSL
    const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
        case gNorm: h = (bNorm - rNorm) / d + 2; break;
        case bNorm: h = (rNorm - gNorm) / d + 4; break;
      }
      h /= 6;
    }

    return {
      hex: `#${cleanHex.toUpperCase()}`,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
      r, g, b
    };
  },

  // SEO & Social Meta Tag Generator
  generateMetaTags({ title, description, url, imageUrl, twitterHandle }) {
    const t = title || 'OmniDrive Tools';
    const d = description || 'Fast, client-side, browser utilities.';
    const u = url || 'https://omnidrive.tools';
    const img = imageUrl || 'https://omnidrive.tools/og-image.png';
    const tw = twitterHandle || '@omnidrive';

    return `<!-- Primary Meta Tags -->
<title>${t}</title>
<meta name="title" content="${t}">
<meta name="description" content="${d}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${u}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${img}">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${u}">
<meta property="twitter:title" content="${t}">
<meta property="twitter:description" content="${d}">
<meta property="twitter:image" content="${img}">
<meta property="twitter:creator" content="${tw}">`;
  },

  // HTML Entity Encoder / Decoder
  htmlEntities(str, encode = true) {
    if (encode) {
      const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
      return str.replace(/[<>&"']/g, (c) => map[c]);
    } else {
      const doc = new DOMParser().parseFromString(str, 'text/html');
      return doc.documentElement.textContent || '';
    }
  },

  // XML to JSON
  xmlToJson(xmlStr) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
    
    function parseNode(node) {
      if (node.nodeType === 3) return node.nodeValue.trim();
      const obj = {};
      if (node.hasAttributes()) {
        obj['@attributes'] = {};
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes.item(i);
          obj['@attributes'][attr.nodeName] = attr.nodeValue;
        }
      }
      if (node.hasChildNodes()) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const item = node.childNodes.item(i);
          const nodeName = item.nodeName;
          if (nodeName === '#text') {
            const val = item.nodeValue.trim();
            if (val) return val;
          } else {
            if (obj[nodeName] === undefined) {
              obj[nodeName] = parseNode(item);
            } else {
              if (!Array.isArray(obj[nodeName])) {
                obj[nodeName] = [obj[nodeName]];
              }
              obj[nodeName].push(parseNode(item));
            }
          }
        }
      }
      return obj;
    }

    return parseNode(xmlDoc.documentElement);
  },

  // JSON to XML
  jsonToXml(obj, rootName = 'root') {
    function toXml(v, name) {
      if (typeof v === 'object' && v !== null) {
        if (Array.isArray(v)) {
          return v.map(item => toXml(item, name)).join('');
        }
        let inner = '';
        for (const [k, val] of Object.entries(v)) {
          inner += toXml(val, k);
        }
        return `<${name}>${inner}</${name}>`;
      }
      return `<${name}>${v}</${name}>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(obj, rootName)}`;
  }
};
