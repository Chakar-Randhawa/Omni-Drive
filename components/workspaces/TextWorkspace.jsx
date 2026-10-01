import React, { useState } from 'react';
import { textEngine } from '../../utils/textEngine';
import { Icon } from '../Icons';

export const TextWorkspace = ({ tool }) => {
  const [inputText, setInputText] = useState('OmniDrive Tools provides 100% browser-based utility processing.');
  const [outputResult, setOutputResult] = useState('');
  const [copied, setCopied] = useState(false);

  // Tool specific configurations
  const [findWord, setFindWord] = useState('');
  const [replaceWord, setReplaceWord] = useState('');
  const [caseMode, setCaseMode] = useState('uppercase');
  const [loremCount, setLoremCount] = useState(3);
  const [loremType, setLoremType] = useState('paragraphs');
  const [promptRole, setPromptRole] = useState('Senior Staff Software Engineer');
  const [promptGoal, setPromptGoal] = useState('Optimize React canvas rendering performance');
  const [promptContext, setPromptContext] = useState('Building a client-side media manipulation suite');
  const [promptConstraints, setPromptConstraints] = useState('Zero third-party cloud uploads, pure offline execution');

  const handleCopy = () => {
    navigator.clipboard.writeText(typeof outputResult === 'object' ? JSON.stringify(outputResult, null, 2) : outputResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = () => {
    switch (tool.id) {
      case 'txt-advanced-word-counter':
        setOutputResult(textEngine.analyzeText(inputText));
        break;
      case 'txt-text-case-converter':
        setOutputResult(textEngine.convertCase(inputText, caseMode));
        break;
      case 'txt-website-slug-url-generator':
        setOutputResult(textEngine.generateSlug(inputText));
        break;
      case 'txt-lorem-ipsum-dummy-generator':
        setOutputResult(textEngine.generateLoremIpsum(loremCount, loremType));
        break;
      case 'txt-find-and-replace-text-processor':
        setOutputResult(inputText.replaceAll(findWord, replaceWord));
        break;
      case 'txt-binary-to-text-converter':
        try {
          setOutputResult(textEngine.binaryToText(inputText));
        } catch (e) {
          setOutputResult(e.message);
        }
        break;
      case 'txt-text-to-binary-converter':
        setOutputResult(textEngine.textToBinary(inputText));
        break;
      case 'txt-string-reverse-utility':
        setOutputResult(textEngine.reverseString(inputText));
        break;
      case 'txt-markdown-table-generator': {
        const rows = [
          '| ID | Feature | Status |',
          '|---|---|---|',
          '| 1 | Client-Side PDF | Completed |',
          '| 2 | Image Compressor | Completed |',
          '| 3 | Audio Trimmer | Completed |'
        ].join('\n');
        setOutputResult(rows);
        break;
      }
      case 'txt-ai-prompt-engineer-builder':
        setOutputResult(textEngine.buildPrompt({
          role: promptRole,
          objective: promptGoal,
          context: promptContext,
          constraints: promptConstraints
        }));
        break;
      default:
        throw new Error(`Unsupported or unhandled text tool operation: ${tool.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Area */}
      {tool.id === 'txt-ai-prompt-engineer-builder' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Target AI Role</label>
              <input
                type="text"
                value={promptRole}
                onChange={(e) => setPromptRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F8FC] border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Objective / Goal</label>
              <input
                type="text"
                value={promptGoal}
                onChange={(e) => setPromptGoal(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F8FC] border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-1">Context & Constraints</label>
            <input
              type="text"
              value={promptConstraints}
              onChange={(e) => setPromptConstraints(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F7F8FC] border border-[#E5E7EB] rounded-xl outline-none"
            />
          </div>
        </div>
      ) : tool.id === 'txt-text-case-converter' ? (
        <div className="space-y-3">
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 text-sm bg-[#F7F8FC] border border-[#E5E7EB] rounded-xl outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {['uppercase', 'lowercase', 'title', 'sentence', 'camel', 'kebab', 'snake', 'constant'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setCaseMode(m); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                  caseMode === m ? 'bg-[#5B5BD6] text-white border-[#5B5BD6]' : 'bg-white border-[#E5E7EB] text-[#4B5563]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      ) : tool.id === 'txt-find-and-replace-text-processor' ? (
        <div className="space-y-3">
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 text-sm bg-[#F7F8FC] border border-[#E5E7EB] rounded-xl outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Find word..."
              value={findWord}
              onChange={(e) => setFindWord(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none"
            />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceWord}
              onChange={(e) => setReplaceWord(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
            Input Text
          </label>
          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 text-sm bg-[#F7F8FC] border border-[#E5E7EB] rounded-xl outline-none"
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleExecute}
        className="px-6 py-2.5 rounded-xl bg-[#5B5BD6] hover:bg-[#4949B8] text-white font-semibold text-sm cursor-pointer shadow-xs"
      >
        Process {tool.name}
      </button>

      {/* Result Area */}
      {outputResult && (
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#EEF0F4]">
            <h4 className="text-sm font-bold text-[#111827]">Formatted Output</h4>
            <div className="flex items-center gap-2">
              {copied && <span className="text-xs text-[#12A88A] font-semibold">Copied!</span>}
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1 bg-[#F7F8FC] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#4B5563] hover:text-[#111827] cursor-pointer flex items-center gap-1"
              >
                <Icon name="copy" className="w-3.5 h-3.5" /> Copy Result
              </button>
            </div>
          </div>

          {typeof outputResult === 'object' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {Object.entries(outputResult).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-[#F7F8FC] border border-[#EEF0F4] text-center">
                  <p className="text-[10px] uppercase font-bold text-[#6B7280]">{k}</p>
                  <p className="text-lg font-extrabold text-[#111827]">{String(v)}</p>
                </div>
              ))}
            </div>
          ) : (
            <textarea
              readOnly
              rows={6}
              value={outputResult}
              className="w-full p-3 text-xs font-mono bg-[#F7F8FC] border border-[#E5E7EB] rounded-xl outline-none resize-y"
            />
          )}
        </div>
      )}
    </div>
  );
};
export default TextWorkspace;
