import singlefile from '@jitl/quickjs-singlefile-browser-release-sync';
import { newQuickJSWASMModuleFromVariant } from 'quickjs-emscripten';

export default async function getQuickJS() {
  return newQuickJSWASMModuleFromVariant(singlefile);
}
