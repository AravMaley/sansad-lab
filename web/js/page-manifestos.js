// Starts the manifesto reader. Lives in its own file because the site's
// content policy does not allow scripts written inside the page.
import { initManifestos } from "./manifestos.js";
import { fail } from "./util.js";

initManifestos().catch((e) => fail(document.getElementById("mf"), e));
