export const textEngine = {
  // Advanced Word Counter
  analyzeText(text) {
    if (!text || !text.trim()) {
      return { words: 0, characters: 0, charactersNoSpaces: 0, sentences: 0, paragraphs: 0, readingTimeMinutes: 0, speakingTimeMinutes: 0 };
    }
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s+/g, '').length;
    const sentences = (text.match(/[^.!?]+[.!?]+(\s|$)/g) || []).length || (text.trim() ? 1 : 0);
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length;
    const readingTimeMinutes = (words / 200).toFixed(1);
    const speakingTimeMinutes = (words / 130).toFixed(1);

    return {
      words,
      characters,
      charactersNoSpaces,
      sentences,
      paragraphs,
      readingTimeMinutes,
      speakingTimeMinutes
    };
  },

  // Case Converter
  convertCase(text, mode) {
    if (!text) return '';
    const words = text.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g) || [text];

    switch (mode) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'title':
        return text.toLowerCase().replace(/(?:^|\s|-)\S/g, (c) => c.toUpperCase());
      case 'sentence':
        return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
      case 'camel':
        return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      case 'pascal':
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      case 'snake':
        return words.map(w => w.toLowerCase()).join('_');
      case 'kebab':
        return words.map(w => w.toLowerCase()).join('-');
      case 'constant':
        return words.map(w => w.toUpperCase()).join('_');
      default:
        return text;
    }
  },

  // Slug Generator
  generateSlug(text, separator = '-') {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, separator)
      .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '');
  },

  // Lorem Ipsum Generator
  generateLoremIpsum(count = 3, type = 'paragraphs') {
    const loremWords = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');

    const getSentence = () => {
      const len = Math.floor(Math.random() * 8) + 8;
      const s = [];
      for (let i = 0; i < len; i++) {
        s.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
      }
      return s[0].charAt(0).toUpperCase() + s[0].slice(1) + (s.length > 1 ? ' ' + s.slice(1).join(' ') : '') + '.';
    };

    if (type === 'words') {
      const result = [];
      for (let i = 0; i < count; i++) {
        result.push(loremWords[i % loremWords.length]);
      }
      return result.join(' ');
    } else if (type === 'sentences') {
      const sentences = [];
      for (let i = 0; i < count; i++) {
        sentences.push(getSentence());
      }
      return sentences.join(' ');
    } else {
      const paras = [];
      for (let i = 0; i < count; i++) {
        const pLen = Math.floor(Math.random() * 3) + 4;
        const sent = [];
        for (let j = 0; j < pLen; j++) sent.push(getSentence());
        paras.push(sent.join(' '));
      }
      return paras.join('\n\n');
    }
  },

  // Binary to Text & Text to Binary
  textToBinary(text) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    return Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join(' ');
  },

  binaryToText(binaryStr) {
    const clean = binaryStr.trim().replace(/\s+/g, ' ');
    if (!clean) return '';
    const bytes = clean.split(' ').map(bin => parseInt(bin, 2));
    if (bytes.some(isNaN)) throw new Error('Invalid binary string. Expected 8-bit bytes (0 and 1).');
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes));
  },

  // String Reverse
  reverseString(text) {
    return Array.from(text).reverse().join('');
  },

  // AI Prompt Engineer Builder
  buildPrompt({ role, objective, context, audience, tone, constraints, outputFormat, examples }) {
    let prompt = '';
    if (role) prompt += `### ROLE\nYou are an expert ${role.trim()}.\n\n`;
    if (objective) prompt += `### OBJECTIVE\n${objective.trim()}\n\n`;
    if (context) prompt += `### CONTEXT & BACKGROUND\n${context.trim()}\n\n`;
    if (audience) prompt += `### TARGET AUDIENCE\n${audience.trim()}\n\n`;
    if (tone) prompt += `### TONE & STYLE\n${tone.trim()}\n\n`;
    if (constraints) prompt += `### CONSTRAINTS & RULES\n${constraints.trim()}\n\n`;
    if (outputFormat) prompt += `### OUTPUT FORMAT\n${outputFormat.trim()}\n\n`;
    if (examples) prompt += `### EXAMPLES & REFERENCE\n${examples.trim()}\n\n`;
    return prompt.trim();
  }
};
