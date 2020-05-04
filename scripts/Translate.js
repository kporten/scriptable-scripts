// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: language;
// Configuration
const API_URL = 'https://api.deepl.com/v2/translate'; // Required
const API_SOURCE_LANG = ''; // Optional (auto detection is supported)
const API_TARGET_LANG = 'EN'; // Optional (default language)
const API_AUTH_KEY = 'PASTE_YOUR_KEY_HERE'; // Required
const TRANSLATION_TARGET = 'QUICKLOOK'; // QUICKLOOK or PASTEBOARD

// Docs on https://www.deepl.com/docs-api/translating-text/request

/* ------------------------------------------------ */

const isConfigValid = checkConfig();

if (isConfigValid) {
  // Start translation
  try {
    const translated = await translate();

    if (translated) {
      await showOutput(translated);
    }
  } catch (e) {
    await showError(e.message);
  }
}

// Finish script safely
Script.complete();

/* ------------------------------------------------ */

async function translate() {
  const values = await getValues();

  if (!values) {
    return '';
  }

  if (!values.text.length) {
    throw new Error('Please enter a text to translate.');
  }

  return reqTranslation(values.text, values.lang);
}

async function getValues() {
  const alert = new Alert();
  alert.title = 'Translate...';
  alert.message = 'Please enter your text and target language.';
  alert.addTextField('Text', Pasteboard.paste());
  alert.addTextField('Language', API_TARGET_LANG);
  alert.addCancelAction('Cancel');
  alert.addAction('Translate');

  const actionIndex = await alert.present();

  if (actionIndex >= 0) {
    const text = alert.textFieldValue(0);
    const lang = cleanText(
      (alert.textFieldValue(1) || API_TARGET_LANG).toUpperCase(),
    );

    return { text, lang };
  }

  return null;
}

async function reqTranslation(text, targetLang) {
  const payload = cleanText(text);

  const req = new Request(API_URL);
  req.method = 'POST';
  req.addParameterToMultipart('auth_key', API_AUTH_KEY);
  req.addParameterToMultipart('source_lang', API_SOURCE_LANG);
  req.addParameterToMultipart('target_lang', targetLang);
  req.addParameterToMultipart('text', payload);

  const json = await req.loadJSON();

  if (json.message) {
    return json.message;
  }

  return json.translations[0].text;
}

function cleanText(text) {
  return text.trim();
}

function checkConfig() {
  let missing = new Set();

  if (!API_URL) {
    missing.add('API_URL');
  }

  if (!API_TARGET_LANG) {
    missing.add('API_TARGET_LANG');
  }

  if (!API_AUTH_KEY) {
    missing.add('API_AUTH_KEY');
  }

  if (missing.size > 0) {
    console.log(
      `Please provide values for the following required variables:\n${[
        ...missing,
      ].join('\n')}`,
    );

    return false;
  }

  return true;
}

async function showOutput(item) {
  if (!item) {
    return;
  }

  if (TRANSLATION_TARGET === 'PASTEBOARD') {
    Pasteboard.copyString(item);
  } else {
    await QuickLook.present(item);
  }
}

async function showError(msg) {
  const alert = new Alert();
  alert.title = '👨‍💻';
  alert.message = msg;
  alert.addCancelAction('OK');

  await alert.present();
}
