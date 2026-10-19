// Small HTML helpers for authoring lesson sources.

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const p = (...parts) => parts.map((x) => `<p>${x}</p>`).join('');
export const ul = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
export const ol = (items) => `<ol>${items.map((x) => `<li>${x}</li>`).join('')}</ol>`;
export const code = (src, lang = 'javascript') =>
  `<pre class="wgba-code" data-lang="${lang}"><code>${esc(String(src).replace(/^\n/, '').replace(/\s+$/, ''))}</code></pre>`;
export const out = (text) => `<pre class="wgba-console wgba-console-static" aria-label="আউটপুট">${esc(String(text).replace(/^\n/, '').replace(/\s+$/, ''))}</pre>`;
export const note = (html) => `<div class="wgba-note">${html}</div>`;
export const warn = (html) => `<div class="wgba-note wgba-note-warn">${html}</div>`;
export const table = (head, rows, caption = '') =>
  `<div class="wgba-table-wrap"><table>${caption ? `<caption>${caption}</caption>` : ''}<thead><tr>${head
    .map((h) => `<th scope="col">${h}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
export const term = (bn, en) => `<strong>${bn}</strong> (<em lang="en">${en}</em>)`;

export const SRC = {
  mdnGuide: ['MDN — JavaScript Guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide'],
  mdnJSON: ['MDN — JSON', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON'],
  mdnAsync: ['MDN — async function', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function'],
  mdnPromise: ['MDN — Using promises', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises'],
  mdnModules: ['MDN — JavaScript modules', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules'],
  mdnErrors: ['MDN — Control flow and error handling', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling'],
  mdnFloat: ['MDN — Number.EPSILON', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON'],
  d2l: ['Zhang et al. — Dive into Deep Learning (d2l.ai)', 'https://d2l.ai/'],
  goodfellow: ['Goodfellow, Bengio, Courville — Deep Learning (2016)', 'https://www.deeplearningbook.org/'],
  jurafsky: ['Jurafsky & Martin — Speech and Language Processing (3rd ed. draft)', 'https://web.stanford.edu/~jurafsky/slp3/'],
  mml: ['Deisenroth, Faisal, Ong — Mathematics for Machine Learning', 'https://mml-book.github.io/'],
  sklearnEval: ['scikit-learn — Model evaluation', 'https://scikit-learn.org/stable/modules/model_evaluation.html'],
  sklearnCV: ['scikit-learn — Cross-validation', 'https://scikit-learn.org/stable/modules/cross_validation.html'],
  googleMLCC: ['Google — Machine Learning Crash Course', 'https://developers.google.com/machine-learning/crash-course'],
  attention: ['Vaswani et al. — Attention Is All You Need (2017)', 'https://arxiv.org/abs/1706.03762'],
  gpt2: ['Radford et al. — Language Models are Unsupervised Multitask Learners (2019)', 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf'],
  bpe: ['Sennrich et al. — Neural Machine Translation of Rare Words with Subword Units (2016)', 'https://arxiv.org/abs/1508.07909'],
  word2vec: ['Mikolov et al. — Efficient Estimation of Word Representations in Vector Space (2013)', 'https://arxiv.org/abs/1301.3781'],
  nucleus: ['Holtzman et al. — The Curious Case of Neural Text Degeneration (2020)', 'https://arxiv.org/abs/1904.09751'],
  instructGPT: ['Ouyang et al. — Training language models to follow instructions with human feedback (2022)', 'https://arxiv.org/abs/2203.02155'],
  dpo: ['Rafailov et al. — Direct Preference Optimization (2023)', 'https://arxiv.org/abs/2305.18290'],
  rag: ['Lewis et al. — Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (2020)', 'https://arxiv.org/abs/2005.11401'],
  bm25: ['Robertson & Zaragoza — The Probabilistic Relevance Framework: BM25 and Beyond (2009)', 'https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf'],
  react: ['Yao et al. — ReAct: Synergizing Reasoning and Acting in Language Models (2022)', 'https://arxiv.org/abs/2210.03629'],
  owaspLLM: ['OWASP — Top 10 for Large Language Model Applications', 'https://owasp.org/www-project-top-10-for-large-language-model-applications/'],
  backprop: ['Rumelhart, Hinton, Williams — Learning representations by back-propagating errors (1986)', 'https://www.nature.com/articles/323533a0'],
  adam: ['Kingma & Ba — Adam: A Method for Stochastic Optimization (2014)', 'https://arxiv.org/abs/1412.6980'],
  layernorm: ['Ba, Kiros, Hinton — Layer Normalization (2016)', 'https://arxiv.org/abs/1607.06450'],
  resnet: ['He et al. — Deep Residual Learning for Image Recognition (2015)', 'https://arxiv.org/abs/1512.03385'],
  dropout: ['Srivastava et al. — Dropout (JMLR 2014)', 'https://jmlr.org/papers/v15/srivastava14a.html'],
  chinchilla: ['Hoffmann et al. — Training Compute-Optimal Large Language Models (2022)', 'https://arxiv.org/abs/2203.15556'],
  quant: ['Dettmers et al. — LLM.int8() (2022)', 'https://arxiv.org/abs/2208.07339'],
  pythonTut: ['Python Tutorial (docs.python.org)', 'https://docs.python.org/3/tutorial/'],
  numpyBasics: ['NumPy — Absolute basics for beginners', 'https://numpy.org/doc/stable/user/absolute_beginners.html'],
  numpyBroadcast: ['NumPy — Broadcasting', 'https://numpy.org/doc/stable/user/basics.broadcasting.html'],
  torchTensors: ['PyTorch — Tensors tutorial', 'https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html'],
  torchAutograd: ['PyTorch — Automatic differentiation (autograd)', 'https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html'],
  torchData: ['PyTorch — Datasets & DataLoaders', 'https://docs.pytorch.org/tutorials/beginner/basics/data_tutorial.html'],
  torchSave: ['PyTorch — Saving and loading models', 'https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html'],
  torchInstall: ['PyTorch — Get started locally', 'https://pytorch.org/get-started/locally/'],
  karpathyMakemore: ['Karpathy — makemore (character-level LM, MIT license)', 'https://github.com/karpathy/makemore'],
  jsonSchema: ['JSON Schema — specification', 'https://json-schema.org/specification'],
  rfc9110: ['RFC 9110 — HTTP Semantics (status codes, Retry-After)', 'https://www.rfc-editor.org/rfc/rfc9110'],
  awsBackoff: ['AWS Architecture Blog — Exponential Backoff and Jitter', 'https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/'],
  sre: ['Google — Site Reliability Engineering book', 'https://sre.google/sre-book/table-of-contents/'],
  heilmeier: ['DARPA — The Heilmeier Catechism', 'https://www.darpa.mil/work-with-us/heilmeier-catechism'],
  pineau: ['Pineau et al. — Improving Reproducibility in Machine Learning Research (2020)', 'https://arxiv.org/abs/2003.12206'],
  keshav: ['S. Keshav — How to Read a Paper', 'https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf'],
  ragas: ['Es et al. — RAGAS: Automated Evaluation of Retrieval Augmented Generation (2023)', 'https://arxiv.org/abs/2309.15217'],
  unicodeBengali: ['Unicode Standard — Bengali block (U+0980–U+09FF)', 'https://www.unicode.org/charts/PDF/U0980.pdf'],
  mdnString: ['MDN — String (UTF-16 code units)', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String'],
  mdnSegmenter: ['MDN — Intl.Segmenter', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter'],
  khan: ['Khan Academy — Linear algebra', 'https://www.khanacademy.org/math/linear-algebra'],
  khanCalc: ['Khan Academy — Differential calculus', 'https://www.khanacademy.org/math/differential-calculus'],
  khanProb: ['Khan Academy — Statistics and probability', 'https://www.khanacademy.org/math/statistics-probability'],
};
