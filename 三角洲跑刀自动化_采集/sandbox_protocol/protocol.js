/* C0 NO-TOUCH SANDBOX ONLY. Contract §3/§4, V04; design F2.
 * Pure comparison, not a game executor, persistence API or security boundary.
 * ES5 syntax for the phone engine. Never coerces identity or evidence types.
 */
var C0Protocol = (function () {
  var ids = ['session_id', 'dispatch_id', 'route_id', 'segment_id', 'profile_id'];
  function failure(reason) { return {ok: false, reason: reason}; }
  function objectFrom(raw) {
    if (typeof raw !== 'string' || raw.length === 0) return null;
    try {
      var value = JSON.parse(raw);
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch (error) { return null; }
  }
  function text(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }
  function requestFrom(raw) {
    var q = objectFrom(raw);
    if (!q || q.schema !== 1 || q.scope !== 'C0_SANDBOX') return null;
    for (var i = 0; i < ids.length; i++) if (!text(q[ids[i]])) return null;
    if (!text(q.expected_producer) || !text(q.end_anchor)) return null;
    return q;
  }
  function sameIdentity(a, b) {
    if (a.schema !== b.schema || a.scope !== b.scope) return false;
    for (var i = 0; i < ids.length; i++) if (a[ids[i]] !== b[ids[i]]) return false;
    return true;
  }
  function authorize(argsRaw, activeRaw, claim) {
    var q = requestFrom(argsRaw);
    if (!q) return failure('INVALID_REQUEST');
    var active = requestFrom(activeRaw);
    if (!active) return failure('NO_ACTIVE_REQUEST');
    if (!sameIdentity(q, active) || q.expected_producer !== active.expected_producer ||
        q.end_anchor !== active.end_anchor) return failure('IDENTITY_MISMATCH');
    if (claim !== '') return failure('ALREADY_CLAIMED');
    return {ok: true, reason: 'AUTHORIZED'};
  }
  function validate(requestRaw, resultRaw) {
    var q = requestFrom(requestRaw);
    if (!q) return failure('INVALID_REQUEST');
    var result = objectFrom(resultRaw);
    if (!result) return failure('INVALID_RESULT');
    if (!sameIdentity(q, result)) return failure('IDENTITY_MISMATCH');
    if (result.producer !== q.expected_producer) return failure('PRODUCER_MISMATCH');
    if (result.end_anchor !== q.end_anchor) return failure('ANCHOR_MISMATCH');
    if (result.status !== 'SKIPPED_NO_CHANGE' || result.action_issued !== false ||
        result.action_confirmed !== true) return failure('UNSAFE_RESULT');
    return {ok: true, reason: 'VERIFIED_SANDBOX_NO_CHANGE'};
  }
  return {authorize: authorize, validate: validate};
}());
