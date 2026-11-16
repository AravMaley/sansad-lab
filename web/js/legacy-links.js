// Old one-page links (/#yourmp, /#match …) now live on their own pages.
// Runs before the page paints, so visitors land on the right page.
(function () {
  var to = { yourmp: "/mps", issues: "/issues", match: "/bills#match", vote: "/bills#vote", street: "/timeline", ledger: "/timeline#ledger" }[location.hash.slice(1)];
  if (to) location.replace(to);
})();
