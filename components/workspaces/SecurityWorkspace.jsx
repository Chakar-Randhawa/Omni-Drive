'use client';

import React, { useState } from 'react';
import { cryptoEngine } from '../../utils/cryptoEngine';
import { Icon } from '../Icons';

export const SecurityWorkspace = ({ tool }) => {
  const [inputText, setInputText] = useState('OmniDrive secure client-side computing');
  const [inputText2, setInputText2] = useState('OmniDrive fast client-side computing');
  const [rounds, setRounds] = useState(10);
  const [outputResult, setOutputResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Tool Specific states
  const [jwtToken, setJwtToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.signature');
  const [regexPattern, setRegexPattern] = useState('[a-zA-Z0-9]+');
  const [regexFlags, setRegexFlags] = useState('g');
  const [subnetIp, setSubnetIp] = useState('192.168.1.1');
  const [subnetCidr, setSubnetCidr] = useState('24');
  const [colorHex, setColorHex] = useState('#5B5BD6');
  const [metaTitle, setMetaTitle] = useState('OmniDrive Tools');
  const [metaDesc, setMetaDesc] = useState('105+ client-side utilities without server uploads.');
  const [metaUrl, setMetaUrl] = useState('https://omnidrive.tools');
  const [htmlEntitiesEncode, setHtmlEntitiesEncode] = useState(true);
  const [xmlInput, setXmlInput] = useState('<root><user id="1"><name>Alice</name><role>Admin</role></user></root>');
  const [jsonInput, setJsonInput] = useState('{\n  "user": {\n    "name": "Alice",\n    "role": "Admin"\n  }\n}');

  const handleCopy = (text) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = async () => {
    setError(null);
    try {
      switch (tool.id) {
        case 'sec-bcrypt-password-hasher': {
          const hash = await cryptoEngine.hashBcrypt(inputText || 'password123', rounds);
          setOutputResult({ hash });
          break;
        }
        case 'sec-password-strength-entropy-meter': {
          const stats = cryptoEngine.calculatePasswordEntropy(inputText);
          setOutputResult(stats);
          break;
        }
        case 'sec-md5-sha256-sha512-hash-generator': {
          const text = inputText || 'OmniDrive';
          const sha256 = await cryptoEngine.hashWebCrypto(text, 'SHA-256');
          const sha512 = await cryptoEngine.hashWebCrypto(text, 'SHA-512');
          const md5 = cryptoEngine.md5(text);
          setOutputResult({ md5, sha256, sha512 });
          break;
        }
        case 'sec-jwt-token-debugger': {
          const jwtData = cryptoEngine.decodeJWT(jwtToken);
          setOutputResult(jwtData);
          break;
        }
        case 'sec-base64-encoder-decoder': {
          const encoded = btoa(unescape(encodeURIComponent(inputText)));
          let decoded = '';
          try { decoded = decodeURIComponent(escape(atob(inputText))); } catch { decoded = '(Not valid Base64 string)'; }
          setOutputResult({ encoded, decoded });
          break;
        }
        case 'sec-json-formatter-validator': {
          const parsed = JSON.parse(inputText);
          const pretty = JSON.stringify(parsed, null, 2);
          const minified = JSON.stringify(parsed);
          setOutputResult({ pretty, minified, valid: true });
          break;
        }
        case 'sec-regex-tester-visualizer': {
          const regex = new RegExp(regexPattern, regexFlags);
          const matches = [...inputText.matchAll(regex)].map(m => m[0]);
          setOutputResult({ matchesCount: matches.length, matches });
          break;
        }
        case 'sec-ip-subnet-calculator': {
          const subnet = cryptoEngine.calculateSubnet(subnetIp, subnetCidr);
          setOutputResult(subnet);
          break;
        }
        case 'sec-automatic-meta-tag-generator': {
          const tags = cryptoEngine.generateMetaTags({
            title: metaTitle,
            description: metaDesc,
            url: metaUrl
          });
          setOutputResult({ tags });
          break;
        }
        case 'sec-text-diff-checker': {
          const diff = cryptoEngine.diffTexts(inputText, inputText2);
          setOutputResult({ diff });
          break;
        }
        case 'sec-url-encoder-decoder': {
          setOutputResult({
            encoded: encodeURIComponent(inputText),
            decoded: decodeURIComponent(inputText)
          });
          break;
        }
        case 'sec-html-entity-converter': {
          const res = cryptoEngine.htmlEntities(inputText, htmlEntitiesEncode);
          setOutputResult({ result: res });
          break;
        }
        case 'sec-xml-to-json-converter': {
          const json = cryptoEngine.xmlToJson(xmlInput);
          setOutputResult({ json: JSON.stringify(json, null, 2) });
          break;
        }
        case 'sec-json-to-xml-converter': {
          const parsed = JSON.parse(jsonInput);
          const xml = cryptoEngine.jsonToXml(parsed, 'root');
          setOutputResult({ xml });
          break;
        }
        case 'sec-hex-to-rgb-color-converter': {
          const colors = cryptoEngine.convertColor(colorHex);
          setOutputResult(colors);
          break;
        }
        default:
          throw new Error(`Unsupported or unhandled security/dev tool operation: ${tool.id}`);
      }
    } catch (err) {
      setError(err.message || 'Error occurred during processing.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool-specific Parameter Inputs */}
      <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6 space-y-4">
        {tool.id === 'sec-bcrypt-password-hasher' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Password to Hash</label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Salt Rounds: {rounds}</label>
              <input
                type="range"
                min="4"
                max="13"
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value, 10))}
                className="w-full max-w-xs accent-[#5B5BD6]"
              />
            </div>
          </div>
        )}

        {tool.id === 'sec-jwt-token-debugger' && (
          <div>
            <label className="block text-xs font-bold uppercase text-[#111827] mb-2">Paste JWT Token</label>
            <textarea
              rows={3}
              value={jwtToken}
              onChange={(e) => setJwtToken(e.target.value)}
              className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-mono"
            />
          </div>
        )}

        {tool.id === 'sec-regex-tester-visualizer' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Regex Pattern</label>
                <input
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Flags</label>
                <input
                  type="text"
                  value={regexFlags}
                  onChange={(e) => setRegexFlags(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Test String</label>
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-sm"
              />
            </div>
          </div>
        )}

        {tool.id === 'sec-ip-subnet-calculator' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">IP Address</label>
              <input
                type="text"
                value={subnetIp}
                onChange={(e) => setSubnetIp(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Subnet CIDR (/X)</label>
              <input
                type="number"
                min="1"
                max="32"
                value={subnetCidr}
                onChange={(e) => setSubnetCidr(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-mono"
              />
            </div>
          </div>
        )}

        {tool.id === 'sec-automatic-meta-tag-generator' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Page Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Meta Description</label>
              <textarea
                rows={2}
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-sm"
              />
            </div>
          </div>
        )}

        {tool.id === 'sec-text-diff-checker' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Original Text</label>
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Modified Text</label>
              <textarea
                rows={4}
                value={inputText2}
                onChange={(e) => setInputText2(e.target.value)}
                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        )}

        {tool.id === 'sec-xml-to-json-converter' && (
          <div>
            <label className="block text-xs font-bold uppercase text-[#111827] mb-1">XML Input</label>
            <textarea
              rows={4}
              value={xmlInput}
              onChange={(e) => setXmlInput(e.target.value)}
              className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-mono"
            />
          </div>
        )}

        {tool.id === 'sec-json-to-xml-converter' && (
          <div>
            <label className="block text-xs font-bold uppercase text-[#111827] mb-1">JSON Input</label>
            <textarea
              rows={4}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-mono"
            />
          </div>
        )}

        {tool.id === 'sec-hex-to-rgb-color-converter' && (
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-14 h-14 rounded-xl cursor-pointer border border-[#E5E7EB]"
            />
            <input
              type="text"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-mono font-bold"
            />
          </div>
        )}

        {/* Standard single input for Hashes, Base64, JSON, URL, Entities */}
        {['sec-password-strength-entropy-meter', 'sec-md5-sha256-sha512-hash-generator', 'sec-base64-encoder-decoder', 'sec-json-formatter-validator', 'sec-url-encoder-decoder', 'sec-html-entity-converter'].includes(tool.id) && (
          <div>
            <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Input Text / Payload</label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#5B5BD6]"
            />
          </div>
        )}
      </div>

      {/* Execute Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExecute}
          className="px-6 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-sm cursor-pointer shadow-xs"
        >
          Compute {tool.name}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#B91C1C] text-sm">
          {error}
        </div>
      )}

      {/* Output Results */}
      {outputResult && (
        <div className="p-6 rounded-2xl bg-white border-2 border-[#4F46E5]/30 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827]">Computed Output</h4>
            <button
              type="button"
              onClick={() => handleCopy(outputResult)}
              className="px-3 py-1.5 bg-[#F7F8FC] hover:bg-[#EEF0F4] text-[#4F46E5] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="copy" className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Result'}</span>
            </button>
          </div>

          <pre className="p-4 bg-[#F7F8FC] border border-[#EEF0F4] rounded-xl text-xs font-mono overflow-x-auto text-[#111827]">
            {typeof outputResult === 'object' ? JSON.stringify(outputResult, null, 2) : outputResult}
          </pre>
        </div>
      )}
    </div>
  );
};
export default SecurityWorkspace;
