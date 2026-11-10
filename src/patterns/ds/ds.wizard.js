/*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash | bundle "wizard" (ds.wizard.json) */
/*
 * Z-Dash bundle "wizard" (tools/bundle.mjs; do not edit): window.DS with
 * DS.core, DS.motion, DS.indicator, DS.dom, DS.ripple, DS.icons, DS.position, DS.overlay, DS.a11y, DS.format, DS.dialog, DS.form, DS.formatted, DS.menu, DS.page, DS.steps, DS.toast, DS.tooltip, DS.truncate, DS.wizard and 11 icons.
 * Icon shapes: Lucide (ISC) and Feather (MIT), see LICENSE.
 * Another bundle or ds.js of the same version on the page adds its modules
 * to the same ZDash.versions[version] object.
 */
(function (root) {
  'use strict';
  var version = '3.0.1';
  // DashboardStyle: the deprecated name from before the rename (3.0), the same object.
  var registry = root.ZDash || root.DashboardStyle || {};
  root.ZDash = registry;
  if (!root.DashboardStyle) root.DashboardStyle = registry;
  var versions = registry.versions || (registry.versions = {});
  var first = versions[version];
  var DS = first || { version: version };
  var add = function (name, exports, make) {
    var theirs = DS[name];
    if (theirs && exports.every(function (key) { return key in theirs; })) return;
    var mine = make();
    if (!theirs) {
      DS[name] = mine;
      return;
    }
    var merged = {};
    Object.keys(theirs).forEach(function (key) { merged[key] = theirs[key]; });
    Object.keys(mine).forEach(function (key) { if (!(key in merged)) merged[key] = mine[key]; });
    DS[name] = Object.freeze(merged);
  };

  add('core', ['runtime', 'define', 'get', 'manage', 'init', 'destroy', 'emit', 'config', 't', 'safeHref'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const registry = globalThis.ZDash ?? globalThis.DashboardStyle ?? {};
    globalThis.ZDash = registry;
    globalThis.DashboardStyle ??= registry;
    function createRuntime() {
    const states = new Map();
    return Object.freeze({
    state(name, init) {
    if (!states.has(name)) states.set(name, typeof init === 'function' ? init() : init ?? {});
    return states.get(name);
    },
    });
    }
    const runtime = registry.runtime ?? createRuntimeOnce();
    function createRuntimeOnce() {
    const made = createRuntime();
    Object.defineProperty(registry, 'runtime', { value: made, enumerable: true });
    return made;
    }
    const DEFAULT_STRINGS = Object.freeze({
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied',
    showMore: 'Show more',
    showLess: 'Show less',
    clear: 'Clear',
    loading: 'Loading',
    more: 'More',
    dismiss: 'Dismiss',
    required: 'Required',
    optional: 'Optional',
    ok: 'OK',
    cancel: 'Cancel',
    confirm: 'Confirm',
    actionFailed: 'That did not work. Try again.',
    valueRequired: 'Enter a value.',
    expand: 'Expand',
    collapse: 'Collapse',
    remove: 'Remove',
    previous: 'Previous',
    next: 'Next',
    noResults: 'No results',
    keyCtrl: 'Ctrl',
    keyAlt: 'Alt',
    keyShift: 'Shift',
    keyMeta: 'Win',
    keyEnter: 'Enter',
    keyEscape: 'Esc',
    keySpace: 'Space',
    keyTab: 'Tab',
    keyBackspace: 'Backspace',
    keyDelete: 'Delete',
    keyHome: 'Home',
    keyEnd: 'End',
    keyPageUp: 'Page Up',
    keyPageDown: 'Page Down',
    hotkeysGeneral: 'General',
    dragHint: 'Press Space to pick up. Then the arrow keys move it, Space drops it and Escape cancels.',
    dragGrabbed: 'Picked up {label}, position {position} of {total}.',
    dragMoved: 'Moved {label} to position {position} of {total}.',
    dragMovedZone: 'Moved {label} to {zone}, position {position} of {total}.',
    dragDropped: 'Dropped {label} at position {position} of {total}.',
    dragDroppedZone: 'Dropped {label} in {zone}, position {position} of {total}.',
    dragCancelled: 'Cancelled. {label} is back at position {position} of {total}.',
    splitpaneResize: 'Resize',
    splitpaneCollapsed: 'Collapsed',
    back: 'Back',
    moreOptionsFor: 'More options for {label}',
    moreActions: 'More actions',
    copyManual: 'Copying is blocked here. The text is selected: press {keys} to copy it.',
    decrease: 'Decrease',
    increase: 'Increase',
    showPassword: 'Show password',
    capsLock: 'Caps Lock is on.',
    strengthWeak: 'Weak',
    strengthFair: 'Fair',
    strengthGood: 'Good',
    strengthStrong: 'Strong',
    passwordStrength: 'Password strength: {level}',
    secretSet: 'Set',
    secretNotSet: 'Not set',
    secretCleared: 'Removed when you save',
    recentSearches: 'Recent searches',
    clearRecent: 'Clear recent searches',
    searchResultsOne: '{count} result',
    searchResultsMany: '{count} results',
    edit: 'Edit',
    save: 'Save',
    saved: 'Saved',
    typeToConfirm: 'Type {name} to confirm',
    errorSummaryOne: 'There is 1 problem',
    errorSummaryMany: 'There are {count} problems',
    otpDigit: 'Digit {index} of {count}',
    otpCharacter: 'Character {index} of {count}',
    charactersLeft: '{count} characters left',
    charactersLeftOne: '1 character left',
    charactersOver: '{count} characters too many',
    charactersOverOne: '1 character too many',
    errorSummaryField: '{label}: {message}',
    createOption: 'Create “{text}”',
    resultsOther: '{count} results',
    typeToSearch: 'Type to search',
    added: 'Added {label}',
    removed: 'Removed {label}',
    selectedCount: '{count} selected',
    tagDuplicate: '{label} is in the list already',
    tagInvalid: '{label} is not valid',
    tagMax: 'Up to {max} items',
    allSelected: 'All selected',
    orderPosition: 'Position {position}',
    transferMoved: 'Moved {count} to {list}',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    selected: 'selected',
    chooseDate: 'Choose date',
    chooseDates: 'Choose dates',
    chooseTime: 'Choose time',
    empty: 'Empty',
    rangeStart: 'Start',
    rangeEnd: 'End',
    presets: 'Presets',
    lastSpan: 'Last {span}',
    timeRange: 'Time range',
    absoluteRange: 'Absolute time range',
    rangeFrom: 'From',
    rangeTo: 'To',
    apply: 'Apply',
    recentRanges: 'Recently used',
    quickRanges: 'Quick ranges',
    refresh: 'Refresh',
    autoRefresh: 'Auto refresh',
    off: 'Off',
    rangeOrder: 'The start must come before the end.',
    retry: 'Retry',
    uploadWaiting: 'Waiting',
    uploadDone: 'Uploaded',
    uploadFailed: 'Upload failed',
    uploadRetry: 'Retry {name}',
    uploadRemove: 'Remove {name}',
    uploadProgress: 'Upload of {name}',
    uploadWrongType: '{name} is not a type this field takes.',
    uploadTooMany: '{name} was not added: at most {max} files.',
    uploadTooLarge: '{name} is larger than {max}.',
    uploadEmpty: '{name} is empty.',
    uploadAdded: 'Added {name}.',
    uploadAddedCount: 'Added {count} files.',
    uploadRemoved: 'Removed {name}.',
    uploadDoneAnnounce: '{name} uploaded.',
    uploadFailedAnnounce: 'Upload of {name} failed.',
    kvAdd: 'Add row',
    kvKeyLabel: 'Key, row {row}',
    kvValueLabel: 'Value, row {row}',
    kvValueOf: 'Value of {key}',
    kvRemove: 'Remove {key}',
    kvRemoveRow: 'Remove row {row}',
    kvShow: 'Show the value of {key}',
    kvShowRow: 'Show the value of row {row}',
    kvDuplicate: '{key} is also on row {rows}: the last one counts.',
    kvNoKey: 'Add a key, or this row is left out.',
    kvRemoved: 'Removed {key}.',
    kvRemovedRow: 'Removed a row.',
    kvPasted: 'Pasted {count} rows.',
    wizardDone: 'done',
    wizardFix: 'Needs attention',
    wizardStepOf: 'Step {index} of {count}',
    wizardStep: 'Step {index} of {count}: {label}',
    wizardError: 'One field needs attention.',
    wizardErrors: '{count} fields need attention.',
    wizardEmpty: 'Not given',
    wizardEdit: 'Edit {label}',
    wizardEditShort: 'Edit',
    wizardYes: 'Yes',
    wizardNo: 'No',
    unsavedOne: '1 unsaved change',
    unsavedMany: '{count} unsaved changes',
    unsavedSaveKey: 'Save changes',
    unsavedSaved: 'Changes saved.',
    unsavedFailed: 'Not saved. Your changes are still here.',
    unsavedDiscarded: 'Changes discarded.',
    unsavedLeaveTitle: 'Leave without saving?',
    unsavedLeaveText: 'Your unsaved changes will be lost.',
    unsavedLeave: 'Discard changes',
    unsavedStay: 'Keep editing',
    unsavedChangedWord: '(changed)',
    queryIs: 'is',
    queryNot: 'is not',
    queryGt: 'over',
    queryGte: 'at least',
    queryLt: 'under',
    queryLte: 'at most',
    queryOr: 'or',
    queryText: 'Text',
    queryRemove: 'Remove filter',
    queryTokenHint: 'Backspace or Delete removes it, F2 edits it.',
    queryUnknownKey: '(not a known filter)',
    queryBadOp: '(this filter does not compare)',
    queryBadValue: '(not a valid value)',
    querySuggestions: 'Suggestions',
    queryKeys: 'Filter by',
    queryOperators: 'Compare',
    querySaved: 'Saved queries',
    querySearch: 'Search',
    querySearchFor: 'Search for "{text}"',
    queryOne: '1 suggestion',
    queryMany: '{count} suggestions',
    queryNoMatch: 'No suggestions',
    queryUnknown: 'Not a known filter',
    querySavedHint: 'Enter applies this saved query, Delete removes it.',
    queryAdded: 'Added filter {label}.',
    queryRemoved: 'Removed filter {label}.',
    queryEditing: 'Editing filter {label}.',
    queryCleared: 'Cleared the query.',
    queryApplied: 'Applied {name}.',
    queryClear: 'Clear the query',
    querySave: 'Save this query',
    querySaveTitle: 'Save the query',
    querySaveName: 'Name',
    querySaveConfirm: 'Save',
    querySavedAs: 'Saved the query as {name}.',
    querySavedRemoved: 'Removed the saved query {name}.',
    datagridSelect: 'Select',
    datagridSelectAll: 'Select all rows',
    datagridSelectRow: 'Select {label}',
    datagridSelected: '{count} selected',
    datagridSelectEvery: 'Select all {total}',
    datagridSelectedEvery: 'All {total} selected',
    datagridDetails: 'Details',
    datagridDetailsOf: 'Details of {label}',
    datagridActions: 'Actions',
    datagridSorted: 'Sorted by {column}, {direction}.',
    datagridUnsorted: 'Sorting removed.',
    datagridSortRank: ', sort {rank}, {direction}',
    datagridAscending: 'ascending',
    datagridDescending: 'descending',
    datagridResize: 'Resize {column}',
    datagridMove: 'Move {column}',
    datagridColumns: 'Columns',
    datagridPresets: 'Views',
    datagridPresetDefault: 'Default',
    datagridPresetAll: 'All columns',
    datagridPresetApplied: '{preset} shown.',
    datagridColumnShown: '{column} shown.',
    datagridColumnHidden: '{column} hidden.',
    datagridRowsOne: '{count} row',
    datagridRowsOther: '{count} rows',
    datagridPage: 'Page {page} of {pages}',
    datagridRange: '{from}–{to} of {total}',
    datagridTotal: 'Total',
    datagridNoValue: 'No value',
    datagridEmpty: 'Nothing here yet',
    datagridNoResultsText: 'Nothing matches the filter.',
    datagridError: 'The data did not load.',
    datagridRetry: 'Try again',
    datagridInvalidNumber: 'Enter a number.',
    datagridEditSaved: '{column} saved.',
    datagridEditRefused: '{column} not saved.',
    datagridCopiedOne: '{count} row copied.',
    datagridCopiedOther: '{count} rows copied.',
    sortAscending: 'Ascending',
    sortDescending: 'Descending',
    sortAscendingText: 'A to Z',
    sortDescendingText: 'Z to A',
    sortAscendingNumber: 'Lowest first',
    sortDescendingNumber: 'Highest first',
    sortAscendingDate: 'Oldest first',
    sortDescendingDate: 'Newest first',
    sortAnnounce: 'Sorted by {field}, {direction}',
    loadMoreStatus: 'Showing {loaded} of {total}',
    loadMoreStatusOpen: 'Showing {loaded}',
    loadMoreDone: 'All {total} shown',
    loadMoreLoaded: 'Loaded {count} more.',
    loadMoreLoading: 'Loading more',
    loadMoreFailed: 'Could not load more.',
    tryAgain: 'Try again',
    removeFilter: 'Remove filter',
    filterRemoved: 'Removed {filter}',
    filtersCleared: 'Filters cleared',
    filtersApplied: '{count} applied',
    filterChip: '{label}: {value}',
    resultsOne: '{count} result',
    showResults: 'Show {results}',
    rangeMin: 'from {min}',
    rangeMax: 'up to {max}',
    rangeBetween: '{min} to {max}',
    facetShowAll: 'Show all {count}',
    facetShowFewer: 'Show fewer',
    facetNoMatch: 'No match for “{query}”',
    facetMatchesOne: '{count} match',
    facetMatchesOther: '{count} matches',
    viewEdited: 'Edited',
    viewDefault: 'Default',
    viewApplied: 'View: {name}',
    viewSaved: 'Saved {name}',
    viewDeleted: 'Deleted {name}',
    viewDefaultSet: '{name} is the default view',
    viewLinkCopied: 'Link copied',
    viewNameLabel: 'Name',
    viewNewTitle: 'Save as a new view',
    viewRenameTitle: 'Rename view',
    viewSave: 'Save',
    viewLinkTitle: 'Link to this view',
    viewDeleteTitle: 'Delete “{name}”?',
    viewDeleteText: 'The view goes from this browser. The list and its data stay as they are.',
    viewDeleteConfirm: 'Delete view',
    treeMove: 'Move {label}',
    treeMoveBefore: 'Before {target}, in {parent}.',
    treeMoveAfter: 'After {target}, in {parent}.',
    treeMoveInside: 'Into {target}.',
    treeDropped: 'Moved {label} to {parent}, position {position} of {total}.',
    treeLoaded: 'Loaded {label}.',
    treeLoadFailed: 'Could not load {label}.',
    treeError: 'Could not load',
    jsonTree: 'JSON',
    jsonSearch: 'Search keys and values',
    jsonFind: 'Search',
    jsonPrevious: 'Previous match',
    jsonNext: 'Next match',
    jsonMatch: '{current} of {total}',
    jsonExpandAll: 'Expand all',
    jsonCollapseAll: 'Collapse all',
    jsonCopyValue: 'Copy the value of {label}',
    jsonCopyPath: 'Copy the path of {label}',
    jsonKey: '{count} key',
    jsonKeys: '{count} keys',
    jsonItem: '{count} item',
    jsonItems: '{count} items',
    jsonInvalid: 'Not valid JSON: line {line}, column {column}.',
    listMove: 'Move {label}',
    listSelected: '{count} selected',
    factsCopy: 'Copy {label}',
    auditlogToday: 'Today',
    auditlogYesterday: 'Yesterday',
    auditlogUndated: 'No date',
    auditlogBefore: 'Before:',
    auditlogAfter: 'After:',
    auditlogNotSet: 'Not set',
    auditlogEvent: '{count} event',
    auditlogEvents: '{count} events',
    auditlogFiltered: '{shown} of {total} events',
    auditlogMore: 'Show {count} more',
    kbdCommand: 'Command',
    kbdOption: 'Option',
    kbdControl: 'Control',
    kbdThen: 'then',
    labelGroupMore: '+{count} more, show all {total}',
    labelGroupAll: 'All labels',
    chartTableView: 'Show as table',
    chartRole: 'chart',
    chartKeys: 'Left and Right move along the points, Up and Down through the series, Page Up and Page Down jump, Home and End go to the ends.',
    chartKeysBars: 'Arrow keys move along the bars, Page Up and Page Down jump, Home and End go to the ends.',
    chartKeysSlices: 'Arrow keys move through the slices, Home and End go to the ends.',
    chartPoint: '{x}: {values}',
    chartSummary: '{name}: from {first} to {last}, lowest {min}, highest {max}',
    chartTotal: 'Total',
    chartOther: 'Other',
    chartShown: '{series} shown',
    chartHidden: '{series} hidden',
    chartEmpty: 'No data',
    moreInfo: 'More information',
    done: 'Done',
    commandOpen: 'Open the command palette',
    commandRecent: 'Recent',
    commandResults: '{count} results',
    commandResultOne: '1 result',
    commandEmpty: 'No results for "{query}"',
    commandFailed: 'Some results could not be loaded.',
    commandBack: 'Back to {page}',
    shortcutsOpen: 'Show the keyboard shortcuts',
    shortcutsGlobal: 'Everywhere',
    shortcutsOff: 'Not available here',
    shortcutsOr: 'or',
    shortcutsEmpty: 'No keyboard shortcuts here.',
    notificationsCount: '{label}, {count} unread',
    notificationsUnread: 'Unread',
    notificationsMarkRead: 'Mark as read',
    notificationsMarkUnread: 'Mark as unread',
    notificationsAllRead: 'All notifications marked as read.',
    notificationsArrived: 'New notification: {title}',
    notificationsArrivedMany: '{count} new notifications',
    notificationsToday: 'Today',
    notificationsYesterday: 'Yesterday',
    notificationsEarlier: 'Earlier',
    notificationsEmpty: 'No notifications',
    notificationsUnreadCount: '{count} unread',
    notificationsError: 'Error',
    notificationsWarning: 'Warning',
    notificationsSuccess: 'Success',
    bannerMore: 'Show {count} more',
    resizePanel: 'Resize the panel',
    stepOf: 'Step {step} of {total}: {label}',
    stepDone: ', done',
    stepError: ', needs attention',
    discardTitle: 'Discard your changes?',
    discardText: 'What you entered is lost.',
    discard: 'Discard',
    keepEditing: 'Keep editing',
    imageOf: 'Image {index} of {total}',
    images: 'Images',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    imageFailed: 'The image could not be loaded.',
    resizeSheet: 'Resize the sheet',
    sheetDetent: 'Sheet at {percent} percent of the screen',
    filterMatch: '{count} match',
    filterMatches: '{count} matches',
    breadcrumbsMore: 'Show {count} more',
    moreTabs: 'More tabs',
    tabClosed: '{label} closed',
    closeTab: 'Close {label}',
    backToTop: 'Back to top',
    editing: 'Editing {label}',
    sectionSaved: '{label} saved',
    presenceOnline: 'Online',
    presenceAway: 'Away',
    presenceBusy: 'Busy',
    presenceOffline: 'Offline',
    avatarStatus: '{name}, {status}',
    avatarMore: '{count} more',
    avatarOverflow: '+{count}',
    mediaSelected: '{count} selected',
    mediaSelectionCleared: 'Selection cleared',
    levelmeterValue: '{value} dB',
    levelmeterLoud: 'Too loud',
    copyCode: 'Copy code',
    codeBlock: 'Code',
    wrapLines: 'Wrap lines',
    footnotes: 'Footnotes',
    footnoteBack: 'Back to reference {number}',
    calloutNote: 'Note',
    calloutTip: 'Tip',
    calloutImportant: 'Important',
    calloutWarning: 'Warning',
    calloutCaution: 'Caution',
    diffAdded: 'Added',
    diffRemoved: 'Removed',
    diffStats: '{added} added, {removed} removed',
    diffFileAdded: 'New file',
    diffFileDeleted: 'Deleted',
    diffFileRenamed: 'Renamed',
    diffFileCopied: 'Copied',
    diffFileBinary: 'Binary',
    diffBinary: 'Binary file, not shown',
    diffNoChanges: 'No changes',
    diffUntitled: 'Untitled',
    diffNoNewline: 'No newline at end of file',
    diffExpandOne: 'Show 1 unchanged line',
    diffExpand: 'Show {count} unchanged lines',
    diffShownOne: '1 more line shown',
    diffShown: '{count} more lines shown',
    diffOldLine: 'Old line',
    diffNewLine: 'New line',
    diffChange: 'Change',
    diffCode: 'Code',
    diffOldCode: 'Before',
    diffNewCode: 'After',
    logName: 'Log',
    logFatal: 'Fatal',
    logError: 'Error',
    logWarn: 'Warning',
    logInfo: 'Info',
    logDebug: 'Debug',
    logTrace: 'Trace',
    logLevels: 'Levels',
    logSearch: 'Search the log',
    logSearchPlaceholder: 'Search',
    logPrevious: 'Previous match',
    logNext: 'Next match',
    logMatch: '{index} of {count}',
    logMatchesOne: '1 match',
    logMatches: '{count} matches',
    logOnlyMatches: 'Only matching lines',
    logWrap: 'Wrap lines',
    logTimestamps: 'Timestamps',
    logCopyLine: 'Copy line',
    logCopyLines: 'Copy {count} lines',
    logCopiedOne: 'Copied 1 line',
    logCopied: 'Copied {count} lines',
    logSelected: '{count} lines selected',
    logLinesOne: '1 line',
    logLines: '{count} lines',
    logShown: '{shown} of {count} lines',
    logEmpty: 'No lines yet',
    logBlank: 'Blank line',
    logNoneShown: 'No line matches the filters',
    logLatest: 'Latest',
    logFollowing: 'Following new lines',
    terminalKeys: 'Terminal keys',
    terminalUp: 'Arrow up',
    terminalDown: 'Arrow down',
    terminalLeft: 'Arrow left',
    terminalRight: 'Arrow right',
    terminalConnecting: 'Connecting',
    terminalConnected: 'Connected',
    terminalDisconnected: 'Disconnected',
    terminalHeld: '{key} held for the next key',
    terminalReleased: '{key} released',
    send: 'Send',
    stop: 'Stop',
    removeNamed: 'Remove {name}',
    filesAttached: 'Attached {names}',
    fileRemoved: 'Removed {name}',
    resultCount: 'Results: {count}',
    latest: 'Latest',
    unreadCount: '{count} new',
    earlierLoaded: 'Earlier messages loaded',
    messageStopped: 'Stopped',
    messageFailed: 'Not completed',
    feedbackThanks: 'Thanks for the feedback',
    tokensOne: '{count} token',
    tokensOther: '{count} tokens',
    reasoningRunning: 'Thinking',
    reasoningDone: 'Thought for {time}',
    toolStatus: '{name}: {status}',
    toolPending: 'Pending',
    toolRunning: 'Running',
    toolDone: 'Done',
    toolFailed: 'Failed',
    toolCancelled: 'Cancelled',
    usageOf: '{used} of {budget}',
    usageShare: '{percent} used',
    usageNear: 'Near the budget',
    usageOver: 'Over budget',
    planWaiting: 'Waiting for approval',
    planApproved: 'Approved',
    planRejected: 'Rejected',
    questionAnswered: 'Answered: {answer}',
    questionSkipped: 'Skipped',
    questionRequired: 'Choose an answer.',
    });
    const core = runtime.state('core', () => ({
    specs: new Map(),
    elements: new WeakMap(),
    roots: new Map(),
    settings: { locale: null, strings: {} },
    }));
    const MANAGED = 'data-ds-managed';
    const NAME = /^[a-z][\w-]*$/;
    const ATTRIBUTE = /^data-ds-[a-z0-9][a-z0-9-]*$/;
    const noop = () => {};
    function report(error) {
    if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
    else globalThis.console?.error?.(error);
    }
    const isNode = (value) => Boolean(value) && typeof value === 'object' && typeof value.nodeType === 'number';
    const viewOf = (node) => (node.nodeType === 9 ? node : node.ownerDocument)?.defaultView ?? globalThis;
    const isManaged = (element) => {
    const owner = element.closest?.(`[${MANAGED}]`);
    return Boolean(owner) && owner.getAttribute(MANAGED) !== 'off';
    };
    const elementSpecs = () => [...core.specs].filter(([, spec]) => spec.init);
    function watchedAttributes() {
    const names = new Set([MANAGED]);
    for (const spec of core.specs.values()) {
    if (spec.attribute) names.add(spec.attribute);
    for (const name of spec.attributes) names.add(name);
    }
    return [...names];
    }
    function define(name, spec) {
    if (typeof name !== 'string' || !NAME.test(name)) throw new TypeError(`DS.core.define: "${name}" is no behaviour name (lower case, digits, - and _)`);
    if (!spec || typeof spec !== 'object') throw new TypeError(`DS.core.define("${name}"): a spec object`);
    if (core.specs.has(name)) return false;
    const attribute = spec.attribute ?? null;
    if (attribute !== null && (typeof attribute !== 'string' || !ATTRIBUTE.test(attribute))) throw new TypeError(`DS.core.define("${name}"): attribute must be a data-ds-* name`);
    if (typeof spec.init !== 'function' && typeof spec.global !== 'function') throw new TypeError(`DS.core.define("${name}"): init(el, ctx) or global(root)`);
    if (spec.init && !attribute && typeof spec.selector !== 'string') throw new TypeError(`DS.core.define("${name}"): init() needs an attribute or a selector`);
    const match = typeof spec.selector === 'string' ? spec.selector : attribute ? `[${attribute}]` : null;
    if (match && typeof globalThis.document?.createDocumentFragment === 'function') {
    try {
    globalThis.document.createDocumentFragment().querySelector(match);
    } catch {
    throw new TypeError(`DS.core.define("${name}"): "${match}" is no selector`);
    }
    }
    const attributes = Object.freeze([...(spec.attributes ?? [])].map(String));
    const entry = Object.freeze({
    attribute,
    match,
    attributes,
    init: typeof spec.init === 'function' ? spec.init : null,
    global: typeof spec.global === 'function' ? spec.global : null,
    });
    core.specs.set(name, entry);
    for (const state of [...core.roots.values()]) {
    if (entry.global) installGlobal(state, name, entry);
    if (entry.init) scan(state.root, state, [[name, entry]]);
    if (state.observer) connect(state);
    }
    return true;
    }
    function attachOne(element, name, spec, state) {
    let entries = core.elements.get(element);
    if (entries?.has(name)) return;
    const abort = typeof AbortController === 'function' ? new AbortController() : null;
    const ctx = Object.freeze({
    name,
    root: state.root,
    signal: abort?.signal ?? null,
    emit: (type, detail, options) => emit(element, type, detail, options),
    t,
    });
    let result;
    try {
    result = spec.init(element, ctx);
    } catch (error) {
    abort?.abort();
    report(error);
    return;
    }
    const controller = result && typeof result === 'object' ? result : null;
    const cleanup = typeof result === 'function' ? result : typeof controller?.destroy === 'function' ? () => controller.destroy() : null;
    if (!entries) core.elements.set(element, (entries = new Map()));
    entries.set(name, {
    state,
    abort,
    cleanup,
    controller,
    handle: controller ?? Object.freeze({ destroy: () => detachOne(element, name) }),
    });
    state.live.add(element);
    }
    function detachOne(element, name) {
    const entries = core.elements.get(element);
    const entry = entries?.get(name);
    if (!entry) return;
    entries.delete(name);
    if (!entries.size) core.elements.delete(element);
    if (![...(entries.values())].some((other) => other.state === entry.state)) entry.state.live.delete(element);
    entry.abort?.abort();
    try {
    entry.cleanup?.();
    } catch (error) {
    report(error);
    }
    }
    function detachAll(element, state) {
    const entries = core.elements.get(element);
    if (!entries) {
    state?.live.delete(element);
    return;
    }
    for (const [name, entry] of [...entries]) if (!state || entry.state === state) detachOne(element, name);
    }
    function scan(node, state, specs = elementSpecs()) {
    if (!specs.length || typeof node?.querySelectorAll !== 'function') return;
    if (node.nodeType === 1 && isManaged(node)) {
    for (const slot of node.querySelectorAll(`[${MANAGED}="off"]`)) {
    const outer = slot.parentNode;
    if (outer?.nodeType === 1 && isManaged(outer)) scan(slot, state, specs);
    }
    return;
    }
    const selector = specs.map(([, spec]) => spec.match).join(', ');
    const found = node.nodeType === 1 && node.matches(selector) ? [node] : [];
    for (const element of node.querySelectorAll(selector)) found.push(element);
    for (const element of found) {
    if (element !== node && isManaged(element)) continue;
    for (const [name, spec] of specs) if (element.matches(spec.match)) attachOne(element, name, spec, state);
    }
    }
    function reconcile(element, changed, state) {
    if (isManaged(element)) return;
    for (const [name, spec] of elementSpecs()) {
    const names = [spec.attribute, ...spec.attributes].filter((attribute) => attribute && changed.has(attribute));
    if (!names.length) continue;
    const entry = core.elements.get(element)?.get(name);
    const matches = element.matches(spec.match);
    if (!entry) {
    if (matches) attachOne(element, name, spec, state);
    } else if (!matches) detachOne(element, name);
    else if (typeof entry.controller?.update === 'function') {
    try {
    entry.controller.update(names);
    } catch (error) {
    report(error);
    }
    } else {
    detachOne(element, name);
    attachOne(element, name, spec, state);
    }
    }
    }
    function get(el, name) {
    const entries = el ? core.elements.get(el) : undefined;
    if (!entries) return null;
    const entry = name === undefined ? entries.values().next().value : entries.get(name);
    return entry?.handle ?? null;
    }
    function manage(el, name) {
    const spec = core.specs.get(name);
    if (!spec?.init || !isNode(el) || el.nodeType !== 1) return null;
    const state = { root: el.getRootNode?.() ?? el.ownerDocument, live: new Set() };
    const watched = [spec.attribute, ...spec.attributes].filter(Boolean);
    const read = () => watched.map((attribute) => el.getAttribute(attribute));
    if (el.matches(spec.match)) attachOne(el, name, spec, state);
    let seen = read();
    let held = true;
    const own = () => {
    const entry = core.elements.get(el)?.get(name);
    return entry?.state === state ? entry : null;
    };
    return {
    get controller() {
    return held ? core.elements.get(el)?.get(name)?.controller ?? null : null;
    },
    update() {
    if (!held) return;
    const now = read();
    const names = watched.filter((attribute, index) => now[index] !== seen[index]);
    seen = now;
    if (!names.length) return;
    const entry = own();
    const matches = el.matches(spec.match);
    if (!entry) {
    if (matches && !core.elements.get(el)?.has(name)) attachOne(el, name, spec, state);
    } else if (!matches) detachOne(el, name);
    else if (typeof entry.controller?.update === 'function') {
    try {
    entry.controller.update(names);
    } catch (error) {
    report(error);
    }
    } else {
    detachOne(el, name);
    attachOne(el, name, spec, state);
    }
    },
    destroy() {
    if (!held) return;
    held = false;
    if (own()) detachOne(el, name);
    },
    };
    }
    function installGlobal(state, name, spec) {
    if (state.globals.has(name)) return;
    let result;
    try {
    result = spec.global(state.root);
    } catch (error) {
    report(error);
    return;
    }
    state.globals.set(name, typeof result === 'function' ? result : typeof result?.destroy === 'function' ? () => result.destroy() : noop);
    }
    function connect(state) {
    state.observer.observe(state.root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: watchedAttributes(),
    });
    }
    function startObserver(state) {
    const Observer = viewOf(state.root).MutationObserver ?? globalThis.MutationObserver;
    if (typeof Observer !== 'function') return;
    state.observer = new Observer((records) => {
    state.pending.push(...records);
    if (state.scheduled) return;
    state.scheduled = true;
    queueMicrotask(() => flush(state));
    });
    connect(state);
    }
    function flush(state) {
    state.scheduled = false;
    if (core.roots.get(state.root) !== state) return;
    const records = state.pending.concat(state.observer?.takeRecords?.() ?? []);
    state.pending = [];
    let removals = false;
    const added = new Set();
    const changed = new Map();
    for (const record of records) {
    if (record.type === 'childList') {
    if (record.removedNodes.length) removals = true;
    for (const node of record.addedNodes) if (node.nodeType === 1) added.add(node);
    } else if (record.type === 'attributes') {
    const element = record.target;
    if (element.getAttribute(record.attributeName) === record.oldValue) continue;
    if (!changed.has(element)) changed.set(element, new Set());
    changed.get(element).add(record.attributeName);
    }
    }
    if (removals) for (const element of [...state.live]) if (!element.isConnected) detachAll(element);
    for (const [element, names] of changed) {
    if (!element.isConnected) {
    detachAll(element);
    continue;
    }
    if (names.has(MANAGED)) added.add(element);
    reconcile(element, names, state);
    }
    for (const node of added) {
    if (!node.isConnected) continue;
    let covered = false;
    for (let parent = node.parentNode; parent && !covered; parent = parent.parentNode) covered = added.has(parent);
    if (!covered) scan(node, state);
    }
    }
    function teardown(state) {
    if (core.roots.get(state.root) !== state) return;
    core.roots.delete(state.root);
    state.observer?.disconnect();
    state.observer = null;
    state.pending = [];
    for (const cleanup of [...state.globals.values()].reverse()) {
    try {
    cleanup();
    } catch (error) {
    report(error);
    }
    }
    state.globals.clear();
    for (const element of [...state.live]) detachAll(element, state);
    }
    const holds = (outer, inner) => outer !== inner && typeof outer.contains === 'function' && outer.contains(inner);
    function init(root = globalThis.document, options = {}) {
    if (!isNode(root) || typeof root.querySelectorAll !== 'function') return { destroy: noop };
    const observe = options.observe ?? true;
    const outer = [...core.roots.values()].find((other) => holds(other.root, root));
    if (outer) {
    scan(root, outer);
    let held = true;
    return {
    destroy() {
    if (!held) return;
    held = false;
    destroy(root);
    },
    };
    }
    let state = core.roots.get(root);
    if (state) state.holders += 1;
    else {
    state = { root, holders: 1, globals: new Map(), live: new Set(), observer: null, pending: [], scheduled: false };
    for (const inner of [...core.roots.values()].filter((other) => holds(root, other.root))) {
    const controlled = [...inner.live];
    inner.live.clear();
    teardown(inner);
    for (const element of controlled) {
    for (const entry of core.elements.get(element)?.values() ?? []) if (entry.state === inner) entry.state = state;
    state.live.add(element);
    }
    }
    core.roots.set(root, state);
    for (const [name, spec] of core.specs) if (spec.global) installGlobal(state, name, spec);
    }
    scan(root, state);
    if (observe && !state.observer) startObserver(state);
    const owner = state;
    let held = true;
    return {
    destroy() {
    if (!held) return;
    held = false;
    if (core.roots.get(owner.root) !== owner) return;
    owner.holders -= 1;
    if (owner.holders <= 0) teardown(owner);
    },
    };
    }
    function destroy(root = globalThis.document) {
    if (!isNode(root)) return;
    for (const state of [...core.roots.values()]) if (state.root === root || holds(root, state.root)) teardown(state);
    for (const state of [...core.roots.values()]) {
    for (const element of [...state.live]) if (element === root || holds(root, element)) detachAll(element, state);
    }
    }
    function emit(el, type, detail, options = {}) {
    const name = String(type).startsWith('ds:') ? String(type) : `ds:${type}`;
    const View = el?.ownerDocument?.defaultView ?? globalThis;
    const Custom = View.CustomEvent ?? globalThis.CustomEvent;
    return el.dispatchEvent(new Custom(name, { bubbles: true, cancelable: Boolean(options?.cancelable), detail: detail ?? null }));
    }
    let frozenStrings = null;
    function config(options) {
    const settings = core.settings;
    const doc = globalThis.document;
    const lang = doc?.documentElement?.lang;
    const localeNow = () => settings.locale ?? (lang || globalThis.navigator?.language || 'en');
    const before = localeNow();
    const changed = [];
    if (options && typeof options === 'object') {
    if ('locale' in options) settings.locale = options.locale ? String(options.locale) : null;
    if (localeNow() !== before) changed.push('locale');
    const texts = Object.entries(options.strings ?? {});
    for (const [key, value] of texts) {
    if (value === null || value === undefined) delete settings.strings[key];
    else settings.strings[key] = typeof value === 'function' ? value : String(value);
    }
    if (texts.length) {
    changed.push('strings');
    settings.version = (settings.version ?? 0) + 1;
    }
    }
    if (!frozenStrings || frozenStrings.of !== settings || frozenStrings.version !== (settings.version ?? 0)) {
    frozenStrings = { of: settings, version: settings.version ?? 0, strings: Object.freeze({ ...DEFAULT_STRINGS, ...settings.strings }) };
    }
    const current = Object.freeze({ locale: localeNow(), strings: frozenStrings.strings });
    if (changed.length && typeof doc?.dispatchEvent === 'function') emit(doc, 'config', { ...current, changed });
    return current;
    }
    function t(key, vars) {
    const own = core.settings.strings;
    const text = Object.hasOwn(own, key) ? own[key] : Object.hasOwn(DEFAULT_STRINGS, key) ? DEFAULT_STRINGS[key] : key;
    const values = vars ?? {};
    const value = typeof text === 'function' ? text(values) : text;
    return String(value).replace(/\{(\w+)\}/g, (match, name) => (Object.hasOwn(values, name) ? String(values[name]) : match));
    }
    const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
    function safeHref(value) {
    if (value === null || value === undefined) return null;
    const text = String(value);
    if (!text.trim()) return null;
    let absolute = null;
    try {
    absolute = new URL(text);
    } catch {
    return text;
    }
    return SAFE_SCHEMES.has(absolute.protocol) ? text : null;
    }

    return Object.freeze({
      runtime: runtime,
      define: define,
      get: get,
      manage: manage,
      init: init,
      destroy: destroy,
      emit: emit,
      config: config,
      t: t,
      safeHref: safeHref
    });
  });

  add('motion', ['MOTION_FALLBACKS', 'LOADER_DELAY_MS', 'LOADER_MIN_VISIBLE_MS', 'STAGGER_MAX', 'motionDuration', 'motionEasing', 'travelDuration', 'resyncScroll', 'stagger', 'replay', 'settled', 'enter', 'leave', 'cancel', 'enterAll', 'staggerOnce', 'loaderHoldMs', 'settleLoader', 'refresh', 'guard', 'setLabel', 'busy', 'COUNT_UP_MS', 'countUp', 'originFrom', 'roll', 'crossfade', 'flip', 'sortable', 'transition'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, runtime = DS.core.runtime;
    const MOTION_FALLBACKS = Object.freeze({
    '--ds-dur-micro': 50,
    '--ds-dur-instant': 100,
    '--ds-dur-fast': 150,
    '--ds-dur-base': 200,
    '--ds-dur-medium': 250,
    '--ds-dur-slow': 350,
    '--ds-dur-long': 450,
    '--ds-dur-glide': 600,
    '--ds-delay-loader': 200,
    '--ds-delay-boot': 400,
    '--ds-hold-loader': 450,
    '--ds-hold-success': 600,
    '--ds-hold-status': 900,
    '--ds-delay-tooltip': 500,
    '--ds-delay-tooltip-skip': 300,
    '--ds-delay-tooltip-hide': 100,
    '--ds-delay-submenu': 100,
    '--ds-delay-submenu-close': 300,
    '--ds-delay-long-press': 500,
    '--ds-delay-dismiss': 300,
    '--ds-ease-in-out': 'cubic-bezier(.2, 0, 0, 1)',
    '--ds-ease-out': 'cubic-bezier(.05, .7, .1, 1)',
    '--ds-ease-in': 'cubic-bezier(.3, 0, 1, 1)',
    '--ds-ease-exit': 'cubic-bezier(.3, 0, .8, .15)',
    '--ds-ease-emphasized': 'cubic-bezier(.2, 0, 0, 1)',
    '--ds-ease-spatial': 'cubic-bezier(.05, .7, .1, 1)',
    '--ds-ease-value': 'cubic-bezier(.2, 0, 0, 1)',
    });
    const LOADER_DELAY_MS = (MOTION_FALLBACKS['--ds-delay-loader']);
    const LOADER_MIN_VISIBLE_MS = (MOTION_FALLBACKS['--ds-hold-loader']);
    const DEFAULT_TIMEOUT_MS = 1000;
    const CEILING_MARGIN_MS = 100;
    const TRAVEL_FULL_PX = 480;
    const STAGGER_MAX = 5;
    function activeIn(node) {
    const root = node?.getRootNode?.();
    return (root?.nodeType === 11 ? root.activeElement : null) ?? node?.ownerDocument?.activeElement ?? null;
    }
    function windowOf(element) {
    return element?.ownerDocument?.defaultView ?? globalThis;
    }
    function computed(element) {
    const view = windowOf(element);
    return typeof view.getComputedStyle === 'function' ? view.getComputedStyle(element) : null;
    }
    function themed(element) {
    return Boolean(element?.closest?.('.ds-theme'));
    }
    function tokenSource(element) {
    return element?.closest?.('.ds-theme') ?? element;
    }
    const OWNED = Symbol.for('ds.owned');
    function own(element, kind, name) {
    if (!element || typeof element !== 'object') return;
    const record = element[OWNED] ?? (element[OWNED] = { attrs: new Map(), classes: new Map(), props: new Map() });
    record[kind].set(name, (record[kind].get(name) ?? 0) + 1);
    }
    function disown(element, kind, name) {
    const map = element?.[OWNED]?.[kind];
    const count = map?.get(name) ?? 0;
    if (count > 1) map.set(name, count - 1);
    else map?.delete(name);
    }
    const NUMBER = '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?';
    const TIME = new RegExp(`^(${NUMBER})(ms|s)$`, 'i');
    const PLAIN = new RegExp(`^${NUMBER}$`, 'i');
    function parseTime(text) {
    const match = TIME.exec(text.trim());
    return match ? Number(match[1]) * (match[2].toLowerCase() === 's' ? 1000 : 1) : null;
    }
    function parseDuration(text) {
    const value = text.trim();
    const time = parseTime(value);
    if (time !== null) return time;
    const product = /^calc\(\s*([^\s*()]+)\s*\*\s*([^\s*()]+)\s*\)$/i.exec(value);
    if (!product) return null;
    const [, left, right] = product;
    if (parseTime(left) !== null && PLAIN.test(right)) return parseTime(left) * Number(right);
    if (PLAIN.test(left) && parseTime(right) !== null) return Number(left) * parseTime(right);
    return null;
    }
    const probed = new Map();
    let probe = (null);
    function probeDuration(element, text) {
    if (probed.has(text)) return probed.get(text);
    const doc = element.ownerDocument;
    const parent = doc?.body ?? doc?.documentElement;
    let ms = null;
    if (parent && typeof doc.createElement === 'function') {
    if (!probe || probe.ownerDocument !== doc) probe = doc.createElement('span');
    probe.hidden = true;
    probe.style.transitionDuration = '';
    probe.style.transitionDuration = text;
    if (probe.style.transitionDuration) {
    parent.append(probe);
    ms = parseTime(computed(probe)?.transitionDuration.split(',')[0] ?? '');
    probe.remove();
    }
    }
    if (probed.size >= 64) probed.clear();
    probed.set(text, ms);
    return ms;
    }
    function motionDuration(element, token) {
    const fallback = typeof MOTION_FALLBACKS[token] === 'number' ? (MOTION_FALLBACKS[token]) : 0;
    if (!themed(element)) return fallback;
    const text = computed(tokenSource(element))?.getPropertyValue(token).trim();
    if (!text) return fallback;
    return parseDuration(text) ?? probeDuration( (element), text) ?? fallback;
    }
    function motionEasing(element, token) {
    const fallback = typeof MOTION_FALLBACKS[token] === 'string' ? (MOTION_FALLBACKS[token]) : 'ease';
    if (!themed(element)) return fallback;
    return computed(tokenSource(element))?.getPropertyValue(token).trim() || fallback;
    }
    function travelDuration(element, px) {
    return travelBetween(motionDuration(element, '--ds-dur-medium'), motionDuration(element, '--ds-dur-slow'), px);
    }
    function travelBetween(medium, slow, px) {
    return medium + (slow - medium) * Math.min(1, Math.abs(Number(px) || 0) / TRAVEL_FULL_PX);
    }
    function splitList(text) {
    const items = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (char === ',' && depth === 0) {
    items.push(text.slice(start, index).trim());
    start = index + 1;
    }
    }
    items.push(text.slice(start).trim());
    return items.filter(Boolean);
    }
    function linearPoints(body) {
    const points = [];
    for (const part of body.split(',')) {
    const [value, ...stops] = part.trim().split(/\s+/);
    if (!PLAIN.test(value ?? '') || stops.length > 2) return null;
    const positions = stops.map((stop) => (/%$/.test(stop) && PLAIN.test(stop.slice(0, -1)) ? Number(stop.slice(0, -1)) / 100 : NaN));
    if (positions.some((at) => Number.isNaN(at))) return null;
    if (positions.length) positions.forEach((at) => points.push({ value: Number(value), at }));
    else points.push({ value: Number(value), at: (null) });
    }
    if (points.length < 2) return null;
    points[0].at ??= 0;
    points.at(-1).at ??= 1;
    let highest = 0;
    for (const point of points) {
    if (point.at === null) continue;
    point.at = Math.max(point.at, highest);
    highest = point.at;
    }
    for (let index = 1; index < points.length; index += 1) {
    if (points[index].at !== null) continue;
    let next = index;
    while (points[next].at === null) next += 1;
    const from = (points[index - 1].at);
    const span = (points[next].at) - from;
    for (let step = index; step < next; step += 1) points[step].at = from + (span * (step - index + 1)) / (next - index + 1);
    index = next;
    }
    return (points);
    }
    function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    const x = (s) => ((ax * s + bx) * s + cx) * s;
    const y = (s) => ((ay * s + by) * s + cy) * s;
    const slope = (s) => (3 * ax * s + 2 * bx) * s + cx;
    return ( t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let s = t;
    for (let step = 0; step < 8; step += 1) {
    const error = x(s) - t;
    if (Math.abs(error) < 1e-7) return y(s);
    const d = slope(s);
    if (Math.abs(d) < 1e-6) break;
    s -= error / d;
    if (s < 0 || s > 1) break;
    }
    let low = 0;
    let high = 1;
    s = t;
    for (let step = 0; step < 50; step += 1) {
    const value = x(s);
    if (Math.abs(value - t) < 1e-7) break;
    if (value < t) low = s;
    else high = s;
    s = (low + high) / 2;
    }
    return y(s);
    };
    }
    const KEYWORDS = ({
    ease: [0.25, 0.1, 0.25, 1],
    'ease-in': [0.42, 0, 1, 1],
    'ease-out': [0, 0, 0.58, 1],
    'ease-in-out': [0.42, 0, 0.58, 1],
    });
    function curve(css) {
    const text = String(css ?? '').trim().toLowerCase();
    if (Object.hasOwn(KEYWORDS, text)) return bezier(...KEYWORDS[text]);
    const cubic = /^cubic-bezier\(([^)]*)\)$/.exec(text);
    if (cubic) {
    const numbers = cubic[1].split(',').map((part) => Number(part.trim()));
    if (numbers.length === 4 && numbers.every(Number.isFinite)) return bezier(...numbers);
    }
    const linear = /^linear\((.*)\)$/.exec(text);
    const points = linear ? linearPoints(linear[1]) : null;
    if (points) {
    return (t) => {
    const last = points.at(-1);
    if (t >= last.at) return last.value;
    if (t <= points[0].at) return points[0].value;
    let index = 0;
    while (points[index + 1].at <= t) index += 1;
    const from = points[index];
    const to = points[index + 1];
    return from.value + ((to.value - from.value) * (t - from.at)) / (to.at - from.at);
    };
    }
    return (t) => Math.min(1, Math.max(0, t));
    }
    function cubicFor(easing, token) {
    if (token && typeof MOTION_FALLBACKS[token] === 'string') return (MOTION_FALLBACKS[token]);
    const points = linearPoints(easing.slice(easing.indexOf('(') + 1, easing.lastIndexOf(')')));
    const springy = Boolean(points?.some((point) => point.value > 1));
    return (MOTION_FALLBACKS[springy ? '--ds-ease-spatial' : '--ds-ease-emphasized']);
    }
    function animateSafe(element, keyframes, timing, token) {
    try {
    return element.animate(keyframes, timing);
    } catch (error) {
    const easing = String(timing.easing ?? '');
    if ( (error)?.name !== 'TypeError' || !easing.includes('linear(')) throw error;
    return element.animate(keyframes, { ...timing, easing: cubicFor(easing, token) });
    }
    }
    const states = new WeakMap();
    function stateOf(element) {
    let state = states.get(element);
    if (!state) {
    state = { gen: 0, opener: null, handoffs: [], inert: false, marked: false };
    states.set(element, state);
    }
    return state;
    }
    const MOTION_CLASS = /^ds-(enter|leave)(--[\w-]+)?$/;
    const stepOwners = new WeakMap();
    function tidyStyle(element) {
    if (element?.getAttribute?.('style')?.trim() === '') element.removeAttribute('style');
    }
    function dropStep(element) {
    if (!stepOwners.has(element)) return;
    stepOwners.delete(element);
    (element).style.removeProperty('--ds-i');
    tidyStyle(element);
    }
    function clearMotion(element) {
    const names = Array.from(element.classList).filter((name) => MOTION_CLASS.test(name));
    if (names.length) element.classList.remove(...names);
    return names.length > 0;
    }
    function flushStyle(element) {
    void computed(element)?.animationName;
    }
    function cancelHandoffs(element, state = stateOf(element)) {
    for (const animation of state.handoffs) animation.cancel();
    state.handoffs = [];
    }
    function markLeaving(element, state, on) {
    if (on) {
    if (state.marked || element.hasAttribute?.('data-ds-leaving')) return;
    element.setAttribute?.('data-ds-leaving', '');
    state.marked = true;
    } else if (state.marked) {
    element.removeAttribute?.('data-ds-leaving');
    state.marked = false;
    }
    }
    function scrollDriven(animation) {
    return typeof animation.timeline?.axis === 'string';
    }
    function resyncScroll(root = globalThis.document) {
    const doc = root?.nodeType === 9 ? root : root?.ownerDocument;
    const win = doc?.defaultView ?? globalThis;
    if (typeof win.ScrollTimeline !== 'function' || typeof doc?.getAnimations !== 'function' || typeof win.requestAnimationFrame !== 'function') return Promise.resolve(0);
    const related = (node) => Boolean(node) && (root === doc || root.contains(node) || node.contains?.(root));
    return new Promise((resolve) => {
    win.requestAnimationFrame(() => win.requestAnimationFrame(() => {
    let restarted = 0;
    for (const animation of doc.getAnimations()) {
    if (!scrollDriven(animation) || animation.timeline.currentTime !== null || animation.currentTime === null) continue;
    if (!related(animation.timeline.source) && !related(animation.effect?.target)) continue;
    animation.cancel();
    animation.play();
    restarted += 1;
    }
    resolve(restarted);
    }));
    });
    }
    function ownAnimations(element) {
    if (typeof element.getAnimations !== 'function') return [];
    return element.getAnimations().filter((animation) => !animation.effect?.pseudoElement && !scrollDriven(animation));
    }
    function iterationsOf(animation) {
    const timing = animation.effect?.getComputedTiming?.() ?? animation.effect?.getTiming?.() ?? {};
    return timing.iterations ?? 1;
    }
    function holdsMotion(animation) {
    const name = animation.animationName;
    const ours = animation.id === 'ds-handoff' || (typeof name === 'string' && name.startsWith('ds-'));
    if (!ours || iterationsOf(animation) === Infinity) return false;
    if (animation.playState === 'running' || animation.playState === 'paused') return true;
    if (animation.playState !== 'finished') return false;
    const fill = animation.effect?.getComputedTiming?.().fill;
    return fill === 'forwards' || fill === 'both';
    }
    function animationNames(element) {
    const value = computed(element)?.animationName;
    return typeof value === 'string' ? splitList(value).filter((name) => name !== 'none') : undefined;
    }
    const TRACKED = ['opacity', 'translate', 'scale', 'clip-path', 'stroke-dashoffset'];
    const camel = (property) => property.replace(/-([a-z])/g, (match, char) => char.toUpperCase());
    const kebab = (property) => property.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
    function readStyle(element, properties) {
    const style = computed(element);
    return Object.fromEntries(properties.map((property) => [property, style ? style.getPropertyValue(property) : '']));
    }
    function trackedProperties(animation) {
    const names = new Set();
    for (const keyframe of animation.effect?.getKeyframes?.() ?? []) {
    for (const key of Object.keys(keyframe)) if (TRACKED.includes(kebab(key))) names.add(kebab(key));
    }
    return [...names];
    }
    function numbersOf(property, value) {
    if (!value || value === 'none') return property === 'scale' ? [1, 1, 1] : [0, 0, 0];
    return (value.match(new RegExp(NUMBER, 'gi')) ?? []).map(Number);
    }
    function remainingShare(tracks, now) {
    const ordered = [...tracks].sort((a, b) => Number(b.properties.includes('opacity')) - Number(a.properties.includes('opacity')));
    for (const track of ordered) {
    for (const property of track.properties) {
    const start = numbersOf(property, track.start[property]);
    const end = numbersOf(property, track.end[property]);
    const current = numbersOf(property, now[property]);
    let share = -1;
    start.forEach((value, index) => {
    const span = Math.abs(value - (end[index] ?? 0));
    if (span > 1e-3 && Number.isFinite(current[index])) share = Math.max(share, Math.abs(current[index] - (end[index] ?? 0)) / span);
    });
    if (share >= 0) return Math.min(1, share);
    }
    }
    return 1;
    }
    function handoff(element, classes, leaving, state) {
    const now = readStyle(element, TRACKED);
    for (const animation of ownAnimations(element)) if (holdsMotion(animation)) animation.cancel();
    state.handoffs = [];
    clearMotion(element);
    flushStyle(element);
    element.classList.add(...classes);
    const names = animationNames(element) ?? [];
    const easings = splitList(computed(element)?.animationTimingFunction ?? '');
    const used = new Set();
    const tracks = [];
    for (const animation of ownAnimations(element)) {
    const name = animation.animationName;
    if (typeof name !== 'string' || !names.includes(name) || iterationsOf(animation) === Infinity) continue;
    let index = names.indexOf(name);
    while (used.has(index) && names.indexOf(name, index + 1) >= 0) index = names.indexOf(name, index + 1);
    used.add(index);
    const timing = animation.effect.getComputedTiming();
    const properties = trackedProperties(animation);
    animation.pause();
    animation.currentTime = 0;
    const start = readStyle(element, properties);
    animation.currentTime = Number(timing.endTime) || 0;
    const end = readStyle(element, properties);
    tracks.push({ animation, properties, start, end, easing: easings[index % (easings.length || 1)] || 'linear', duration: Number(timing.duration) || 0 });
    }
    for (const track of tracks) track.animation.cancel();
    const share = remainingShare(tracks, now);
    const floor = motionDuration(element, '--ds-dur-micro');
    const covered = new Set(tracks.flatMap((track) => track.properties));
    const rest = readStyle(element, TRACKED.filter((property) => !covered.has(property)));
    const longest = Math.max(0, ...tracks.map((track) => track.duration)) || motionDuration(element, leaving ? '--ds-dur-fast' : '--ds-dur-medium');
    for (const [property, value] of Object.entries(rest)) {
    if (!differs(property, now[property], value)) continue;
    const opacity = property === 'opacity';
    let easing = leaving ? easings.at(-1) : (easings.length > 1 && !opacity ? easings.at(-1) : '');
    let token;
    if (!easing) {
    token = opacity ? '--ds-ease-in-out' : '--ds-ease-spatial';
    easing = motionEasing(element, token);
    }
    const end = value === 'none' && property === 'clip-path' && now[property].startsWith('inset(') ? 'inset(0px)' : value;
    tracks.push({ properties: [property], end: { [property]: end }, easing, token, duration: longest });
    }
    for (const track of tracks) {
    if (!track.properties.length) continue;
    const from = {};
    const to = {};
    for (const property of track.properties) {
    from[camel(property)] = now[property];
    to[camel(property)] = track.end[property];
    }
    const animation = animateSafe(element, [from, to], {
    id: 'ds-handoff',
    duration: Math.max(floor, track.duration * share),
    delay: 0,
    easing: track.easing,
    fill: leaving ? 'forwards' : 'none',
    }, track.token);
    animation.id = 'ds-handoff';
    state.handoffs.push(animation);
    }
    return names;
    }
    function differs(property, a, b) {
    if (a === b) return false;
    const pad = (values) => (property === 'scale' && values.length === 1 ? [values[0], values[0]] : values);
    const x = pad(numbersOf(property, a));
    const y = pad(numbersOf(property, b));
    const identity = property === 'scale' ? 1 : 0;
    return Array.from({ length: Math.max(x.length, y.length) }, (_, index) => index)
    .some((index) => Math.abs((x[index] ?? identity) - (y[index] ?? identity)) > 1e-3);
    }
    function play(element, classes, leaving, state) {
    return playEach([{ element, classes, state }], leaving)[0];
    }
    function playEach(entries, leaving) {
    const moving = entries.map(({ element }) => ownAnimations(element).some(holdsMotion));
    let dirty = null;
    entries.forEach(({ element, state }, index) => {
    if (moving[index]) return;
    cancelHandoffs(element, state);
    if (clearMotion(element)) dirty ??= element;
    });
    if (dirty) flushStyle(dirty);
    entries.forEach(({ element, classes }, index) => {
    if (!moving[index]) element.classList.add(...classes);
    });
    return entries.map(({ element, classes, state }, index) => (moving[index]
    ? handoff(element, classes, leaving, state)
    : animationNames(element)));
    }
    function releaseFocus(element, focus, state) {
    const active = activeIn(element);
    if (!active || !element.contains?.(active)) return;
    const usable = (node) => Boolean(node) && node.isConnected !== false && !element.contains(node)
    && typeof node.focus === 'function' && !node.closest?.('[inert]');
    const wanted = typeof focus === 'function' ? focus() : focus;
    const target = [wanted, state.opener, element.parentElement?.closest?.('[tabindex="-1"]')].find(usable);
    if (target) target.focus({ preventScroll: true });
    const still = activeIn(element);
    if (still && element.contains(still)) still.blur?.();
    }
    function stagger(elements, options = {}) {
    const from = options.from || 0;
    const max = options.max === undefined ? STAGGER_MAX : options.max;
    let index = 0;
    for (const element of elements) {
    (element).style.setProperty('--ds-i', String(Math.min(from + index, max)));
    index += 1;
    }
    }
    function replay(element, ...classNames) {
    if (!element) return;
    if (classNames.some((name) => element.classList.contains(name))) {
    element.classList.remove(...classNames);
    if (typeof element.getAnimations === 'function') void element.getAnimations();
    else flushStyle(element);
    }
    element.classList.add(...classNames);
    }
    function timeScale(element) {
    const style = computed(element);
    const value = style ? parseFloat(style.getPropertyValue('--ds-time-scale')) : NaN;
    return value > 0 ? value : 1;
    }
    function nextFrame(view) {
    return new Promise((resolve) => {
    const timer = setTimeout(resolve, CEILING_MARGIN_MS);
    if (typeof view.requestAnimationFrame === 'function') {
    view.requestAnimationFrame(() => {
    clearTimeout(timer);
    resolve(undefined);
    });
    }
    });
    }
    function remainingMs(animation) {
    const timing = animation.effect?.getComputedTiming?.() ?? {};
    const end = Number(timing.endTime);
    if (!Number.isFinite(end)) return DEFAULT_TIMEOUT_MS;
    const rate = Math.abs(animation.playbackRate ?? 1) || 1;
    return Math.max(0, end - (Number(animation.currentTime) || 0)) / rate;
    }
    function watched(element, options) {
    const transitionsOnly = options.event === 'transitionend';
    const transitions = transitionsOnly || options.transitions === true;
    const names = options.names;
    return element.getAnimations({ subtree: options.subtree === true }).filter((animation) => {
    if (!animation.effect || animation.effect.pseudoElement || scrollDriven(animation)) return false;
    if (animation.playState === 'idle' || iterationsOf(animation) === Infinity) return false;
    if (typeof animation.transitionProperty === 'string') {
    return transitions && (!options.property || animation.transitionProperty === options.property);
    }
    if (transitionsOnly) return false;
    if (typeof animation.animationName === 'string') return !names || names.includes(animation.animationName);
    return animation.id === 'ds-handoff' || Boolean(names?.includes(animation.id));
    });
    }
    function allFinished(list, timeout) {
    return new Promise((resolve) => {
    let timer = 0;
    let done = false;
    let wasPaused = false;
    const finish = () => {
    done = true;
    clearTimeout(timer);
    resolve(undefined);
    };
    const arm = (first) => {
    if (done) return;
    const open = list.filter((animation) => animation.playState === 'running' || animation.playState === 'paused');
    const paused = timeout === undefined && open.some((animation) => animation.playState === 'paused');
    if (!first && !paused && !wasPaused) {
    finish();
    return;
    }
    wasPaused = paused;
    const wait = first && timeout !== undefined ? timeout : Math.max(0, ...open.map(remainingMs)) + CEILING_MARGIN_MS;
    timer = (setTimeout(() => arm(false), wait));
    };
    arm(true);
    Promise.allSettled(list.map((animation) => animation.finished)).then(finish);
    });
    }
    function settledByEvents(element, options) {
    const transitions = options.event === 'transitionend' || options.transitions === true;
    const types = transitions ? ['transitionend', 'transitioncancel'] : ['animationend', 'animationcancel'];
    const expected = !transitions && options.names?.length ? new Set(options.names) : null;
    const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS * timeScale(element);
    return new Promise((resolve) => {
    let timer = 0;
    const finish = () => {
    clearTimeout(timer);
    for (const type of types) element.removeEventListener(type, done);
    resolve(undefined);
    };
    const done = ( evt) => {
    if (evt.target !== element || evt.pseudoElement) return;
    if (transitions && options.property && evt.propertyName !== options.property) return;
    if (expected && evt.animationName) {
    expected.delete(evt.animationName);
    if (expected.size) return;
    }
    finish();
    };
    for (const type of types) element.addEventListener(type, done);
    timer = (setTimeout(finish, timeout));
    });
    }
    function settled(element, options = {}) {
    if (!element) return Promise.resolve();
    if (typeof element.getAnimations !== 'function') return settledByEvents(element, options);
    const first = watched(element, options);
    if (first.length) return allFinished(first, options.timeout);
    return nextFrame(windowOf(element)).then(() => {
    const later = watched(element, options);
    return later.length ? allFinished(later, options.timeout) : undefined;
    });
    }
    function enter(element, variant = '') {
    if (!element) return Promise.resolve();
    return enterEach([element], variant)[0];
    }
    function enterEach(elements, variant = '') {
    const classes = variant ? ['ds-enter', `ds-enter--${variant}`] : ['ds-enter'];
    const entries = elements.map((element) => {
    const state = stateOf(element);
    const gen = ++state.gen;
    const doc = element.ownerDocument;
    const active = activeIn(element);
    state.opener = active && active !== doc?.body && !element.contains?.(active) ? active : null;
    dropStep(element);
    if ( (element).hidden) (element).hidden = false;
    if ( (element).inert) (element).inert = false;
    state.inert = false;
    markLeaving(element, state, false);
    return { element, classes, state, gen };
    });
    const names = playEach(entries, false);
    return entries.map(({ element, state, gen }, index) => settled(element, { names: names[index] }).then(() => {
    if (state.gen !== gen) return;
    clearMotion(element);
    cancelHandoffs(element, state);
    }));
    }
    function leave(element, variant = '', options = {}) {
    if (!element) return Promise.resolve();
    return leaveEach([element], variant, options)[0];
    }
    function leaveEach(elements, variant = '', options = {}) {
    const then = options.then || 'remove';
    const classes = variant ? ['ds-leave', `ds-leave--${variant}`] : ['ds-leave'];
    const entries = elements.map((element) => {
    const state = stateOf(element);
    const gen = ++state.gen;
    releaseFocus(element, options.focus, state);
    if (!( (element).inert)) {
    (element).inert = true;
    state.inert = true;
    }
    markLeaving(element, state, then === 'remove');
    return { element, classes, state, gen };
    });
    const names = playEach(entries, true);
    return entries.map(({ element, state, gen }, index) => settled(element, { names: names[index] }).then(() => {
    if (state.gen !== gen) return;
    if (then === 'remove') element.remove();
    else if (then === 'hide') {
    (element).hidden = true;
    if (state.inert) (element).inert = false;
    state.inert = false;
    clearMotion(element);
    cancelHandoffs(element, state);
    }
    }));
    }
    function cancel(element) {
    if (!element) return;
    const state = stateOf(element);
    state.gen += 1;
    cancelHandoffs(element, state);
    clearMotion(element);
    dropStep(element);
    if (state.inert) (element).inert = false;
    state.inert = false;
    markLeaving(element, state, false);
    }
    function inView(element, view) {
    const rect = element.getBoundingClientRect?.();
    const width = view.innerWidth;
    const height = view.innerHeight;
    if (!rect || !(width > 0) || !(height > 0)) return true;
    return rect.bottom > 0 && rect.right > 0 && rect.top < height && rect.left < width;
    }
    function enterAll(elements, variant = '', options = {}) {
    const { stagger: staggered = true, max = STAGGER_MAX, visibleOnly = true } = options;
    const items = Array.from(elements ?? []).filter(Boolean);
    if (!items.length) return Promise.resolve();
    const classes = variant ? ['ds-enter', `ds-enter--${variant}`] : ['ds-enter'];
    const batchId = {};
    const moving = items.filter((item) => ownAnimations(item).some(holdsMotion));
    const batch = items.filter((item) => !moving.includes(item));
    const gens = new Map();
    let dirty = null;
    for (const item of batch) {
    const state = stateOf(item);
    gens.set(item, ++state.gen);
    cancelHandoffs(item, state);
    dropStep(item);
    if (item.hidden) item.hidden = false;
    if (item.inert) item.inert = false;
    state.inert = false;
    if (clearMotion(item)) dirty ??= item;
    }
    if (dirty) flushStyle(dirty);
    const shown = visibleOnly && batch.length ? batch.filter((item) => inView(item, windowOf(batch[0]))) : batch;
    shown.forEach((item, index) => {
    if (staggered) {
    item.style.setProperty('--ds-i', String(Math.min(index, max)));
    stepOwners.set(item, batchId);
    }
    item.classList.add(...classes);
    });
    const current = (item) => stateOf(item).gen === gens.get(item);
    const playing = shown.map((item) => settled(item, { names: animationNames(item) }).then(() => {
    if (current(item)) clearMotion(item);
    }));
    const continued = moving.map((item) => enter(item, variant));
    return Promise.all([...playing, ...continued]).then(() => {
    for (const item of shown) if (stepOwners.get(item) === batchId) dropStep(item);
    });
    }
    function staggerOnce(container, options = {}) {
    if (!container || container.hasAttribute('data-ds-staggered')) return Promise.resolve();
    container.setAttribute('data-ds-staggered', '');
    const items = Array.from(container.children).filter((child) => !child.hasAttribute('data-ds-keep'));
    return enterAll(items, options.variant ?? 'swap', { max: options.max ?? STAGGER_MAX, visibleOnly: true });
    }
    function loaderHoldMs(startedAt, now = Date.now(), options = {}) {
    const element = options.element ?? null;
    const delayToken = element?.closest?.('.ds-boot') ? '--ds-delay-boot' : '--ds-delay-loader';
    const delay = options.delay ?? (element ? motionDuration(element, delayToken) : LOADER_DELAY_MS);
    const minVisible = options.minVisible ?? (element ? motionDuration(element, '--ds-hold-loader') : LOADER_MIN_VISIBLE_MS);
    const visible = now - startedAt - delay;
    if (visible <= 0 || visible >= minVisible) return 0;
    return minVisible - visible;
    }
    function settleLoader(startedAt, options, legacy = {}) {
    const numeric = typeof options === 'number';
    const settings = numeric ? legacy : (options !== null && typeof options === 'object' ? options : {});
    const now = numeric ? options : settings.now ?? Date.now();
    const ms = loaderHoldMs(startedAt, now, { element: settings.element, delay: settings.delay, minVisible: settings.minVisible });
    return ms ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
    }
    const refreshes = new WeakMap();
    function abortError(signal) {
    const reason = signal?.reason;
    if (reason instanceof Error) return reason;
    return typeof DOMException === 'function' ? new DOMException('The refresh was aborted', 'AbortError') : Object.assign(new Error('The refresh was aborted'), { name: 'AbortError' });
    }
    function refresh(container, load, options = {}) {
    const signal = options.signal;
    if (signal?.aborted) return Promise.reject(abortError(signal));
    if (!container) return Promise.resolve().then(() => load());
    let run = refreshes.get(container);
    if (!run) {
    const doc = container.ownerDocument;
    run = { count: 0, bar: null, busy: container.getAttribute('aria-busy'), startedAt: Date.now() };
    refreshes.set(container, run);
    own(container, 'classes', 'ds-stale');
    own(container, 'attrs', 'aria-busy');
    container.classList.add('ds-stale');
    container.setAttribute('aria-busy', 'true');
    const parent = container.parentElement;
    if (options.loadbar !== false && parent?.matches?.('.ds-content, .ds-page') && doc) {
    const bar = doc.createElement('span');
    bar.className = 'ds-loadbar';
    bar.setAttribute('aria-hidden', 'true');
    const fill = doc.createElement('span');
    fill.className = 'ds-loadbar__bar';
    bar.append(fill);
    parent.insertBefore(bar, parent.firstChild);
    run.bar = bar;
    }
    }
    run.count += 1;
    const current = run;
    const done = () => {
    current.count -= 1;
    if (current.count > 0) return Promise.resolve();
    return settleLoader(current.startedAt, { element: current.bar ?? container }).then(() => {
    if (current.count > 0 || refreshes.get(container) !== current) return;
    refreshes.delete(container);
    if (current.bar) leave(current.bar);
    container.classList.remove('ds-stale');
    disown(container, 'classes', 'ds-stale');
    disown(container, 'attrs', 'aria-busy');
    if (current.busy === null) container.removeAttribute('aria-busy');
    else container.setAttribute('aria-busy', current.busy);
    });
    };
    const loading = new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError(signal));
    signal?.addEventListener('abort', onAbort, { once: true });
    Promise.resolve().then(() => load()).then(resolve, reject)
    .finally(() => signal?.removeEventListener('abort', onAbort));
    });
    return loading.then(
    (data) => done().then(() => {
    if (signal?.aborted) throw abortError(signal);
    return data;
    }),
    (error) => done().then(() => {
    throw error;
    }),
    );
    }
    const BUSY_ACTION = '.ds-btn:is([aria-busy="true"], .ds-btn--done)';
    const DISABLED_ACTION = `:is(${[
    'a',
    'button',
    'input',
    'summary',
    '[role="button"]',
    '[role="switch"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="tab"]',
    '[role="option"]',
    '[role="menuitem"]',
    '[role="menuitemcheckbox"]',
    '[role="menuitemradio"]',
    ].join(', ')})[aria-disabled="true"]`;
    const GUARDED_EVENTS = ['click', 'auxclick', 'submit'];
    const GUARDED_KEY_EVENTS = ['keydown', 'keyup'];
    const RANGE_HOLD_EVENTS = ['pointerdown', 'keydown', 'focusin'];
    const RANGE_MOVE_EVENTS = ['input', 'change'];
    const NATIVE_ACTION = new Set(['A', 'BUTTON', 'INPUT', 'SUMMARY']);
    const guards = runtime.state('guard', () => new WeakMap());
    function blockedAction(node) {
    const element = node?.nodeType === 1 ? node : node?.parentElement ?? null;
    if (typeof element?.closest !== 'function' || !element.closest('.ds-theme')) return null;
    const action = element.closest(`${BUSY_ACTION}, ${DISABLED_ACTION}`);
    return action && !action.closest('[data-ds-guard="off"]') ? action : null;
    }
    function blockActivation(event) {
    if (event.isTrusted === false) return;
    const source = event.type === 'submit' ? event.submitter : event.target;
    if (!blockedAction(source)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    }
    function blockKeys(event) {
    if (event.isTrusted === false || (event.key !== 'Enter' && event.key !== ' ')) return;
    const action = blockedAction(event.target);
    if (!action || action !== event.target || NATIVE_ACTION.has(action.tagName)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    }
    const heldRanges = new WeakMap();
    function isBlockedRange(node) {
    return node?.tagName === 'INPUT' && node.type === 'range' && blockedAction(node) === node;
    }
    function holdRange(event) {
    if (event.isTrusted !== false && isBlockedRange(event.target)) heldRanges.set(event.target, event.target.value);
    }
    function blockRangeMove(event) {
    if (event.isTrusted === false || !isBlockedRange(event.target)) return;
    if (heldRanges.has(event.target)) event.target.value = heldRanges.get(event.target);
    event.stopImmediatePropagation();
    }
    function holdGuard(root) {
    const installed = guards.get(root);
    if (installed) {
    installed.holders += 1;
    return true;
    }
    const target = root.nodeType === 9 ? root.defaultView ?? root : root;
    if (typeof target?.addEventListener !== 'function') return false;
    for (const type of GUARDED_EVENTS) target.addEventListener(type, blockActivation, true);
    for (const type of GUARDED_KEY_EVENTS) target.addEventListener(type, blockKeys, true);
    for (const type of RANGE_HOLD_EVENTS) target.addEventListener(type, holdRange, true);
    for (const type of RANGE_MOVE_EVENTS) target.addEventListener(type, blockRangeMove, true);
    guards.set(root, { target, holders: 1, activation: blockActivation, keys: blockKeys, rangeHold: holdRange, rangeMove: blockRangeMove });
    return true;
    }
    function releaseGuard(root) {
    const installed = guards.get(root);
    if (!installed) return;
    installed.holders -= 1;
    if (installed.holders > 0) return;
    for (const type of GUARDED_EVENTS) installed.target.removeEventListener(type, installed.activation, true);
    for (const type of GUARDED_KEY_EVENTS) installed.target.removeEventListener(type, installed.keys, true);
    for (const type of RANGE_HOLD_EVENTS) installed.target.removeEventListener(type, installed.rangeHold, true);
    for (const type of RANGE_MOVE_EVENTS) installed.target.removeEventListener(type, installed.rangeMove, true);
    guards.delete(root);
    }
    function guard(root = globalThis.document) {
    let held = Boolean(root) && holdGuard(root);
    return {
    destroy() {
    if (!held) return;
    held = false;
    releaseGuard(root);
    },
    };
    }
    define('guard', {
    global(root) {
    const held = guard(root.nodeType === 9 || root.nodeType === 11 ? root : root.getRootNode?.() ?? root.ownerDocument);
    return () => held.destroy();
    },
    });
    const busyGuarded = new WeakSet();
    function guardFor(element) {
    const root = element?.getRootNode?.();
    const usable = root && (root.nodeType === 9 || root.nodeType === 11) ? root : element?.ownerDocument;
    if (!usable || busyGuarded.has(usable)) return;
    if (holdGuard(usable)) busyGuarded.add(usable);
    }
    const busyRuns = new WeakMap();
    const doneTimers = new WeakMap();
    const pendingLabels = new WeakMap();
    function clearDone(button) {
    if (doneTimers.has(button)) {
    clearTimeout(doneTimers.get(button));
    doneTimers.delete(button);
    disown(button, 'classes', 'ds-btn--done');
    disown(button, 'classes', 'ds-btn--failed');
    }
    button.classList?.remove('ds-btn--done', 'ds-btn--failed');
    applyLabel(button);
    }
    function showEnd(button, name, hold) {
    own(button, 'classes', name);
    button.classList.add(name);
    doneTimers.set(button, setTimeout(() => clearDone(button), motionDuration(button, hold)));
    }
    function restFace(button) {
    const faces = Array.from(button.children ?? []).find((child) => child.classList?.contains('ds-btn__faces'));
    if (!faces) return null;
    return Array.from(faces.children ?? []).find((face) => face.classList?.contains('ds-btn__face')
    && !face.classList.contains('ds-btn__face--busy') && !face.classList.contains('ds-btn__face--done')
    && !face.classList.contains('ds-btn__face--failed')) ?? null;
    }
    function writeLabel(slot, text) {
    const texts = Array.from(slot.childNodes ?? []).filter((node) => node.nodeType === 3 && node.nodeValue.trim());
    if (!texts.length) {
    slot.append(slot.ownerDocument.createTextNode(text));
    return;
    }
    texts[0].nodeValue = text;
    for (const node of texts.slice(1)) node.remove();
    }
    function applyLabel(button) {
    if (!pendingLabels.has(button) || busyRuns.has(button) || doneTimers.has(button)) return;
    const text = (pendingLabels.get(button));
    pendingLabels.delete(button);
    const slot = restFace(button) ?? button;
    const label = Array.from(slot.children ?? []).find((child) => child.classList?.contains('ds-btn__label'));
    writeLabel(label ?? slot, text);
    }
    function setLabel(button, text) {
    if (!button) return;
    pendingLabels.set(button, String(text ?? ''));
    applyLabel(button);
    }
    function busy(button, work, options = {}) {
    const start = () => {
    try {
    return typeof work === 'function' ? (work)() : work;
    } catch (error) {
    return Promise.reject(error);
    }
    };
    if (!button) return Promise.resolve(start());
    const running = busyRuns.get(button);
    if (running) return running;
    guardFor(button);
    const face = Boolean(button.querySelector?.(':scope > .ds-btn__faces > .ds-btn__face--done'));
    const done = face && (options.done ?? true);
    const failedFace = Boolean(button.querySelector?.(':scope > .ds-btn__faces > .ds-btn__face--failed'));
    const failed = failedFace && (options.failed ?? true);
    clearDone(button);
    own(button, 'attrs', 'aria-busy');
    button.setAttribute('aria-busy', 'true');
    const startedAt = Date.now();
    const delay = motionDuration(button, '--ds-delay-loader');
    let promise;
    const finish = () => {
    if (busyRuns.get(button) === promise) busyRuns.delete(button);
    button.removeAttribute('aria-busy');
    disown(button, 'attrs', 'aria-busy');
    };
    promise = Promise.resolve(start()).then(
    (value) => settleLoader(startedAt, { element: button, delay }).then(() => {
    finish();
    if (done) showEnd(button, 'ds-btn--done', '--ds-hold-success');
    else applyLabel(button);
    return value;
    }),
    (error) => {
    if (!failed) {
    finish();
    applyLabel(button);
    throw error;
    }
    return settleLoader(startedAt, { element: button, delay }).then(() => {
    finish();
    showEnd(button, 'ds-btn--failed', '--ds-hold-status');
    throw error;
    });
    },
    );
    busyRuns.set(button, promise);
    return promise;
    }
    const COUNT_UP_MS = (MOTION_FALLBACKS['--ds-dur-glide']);
    const counts = new WeakMap();
    const shownValues = new WeakMap();
    const doneHandle = () => ({ cancel() {}, finished: Promise.resolve() });
    function startClock(element, duration) {
    if (typeof element.animate !== 'function') return null;
    try {
    const clock = animateSafe(element, [], { id: 'ds-count', duration });
    clock.id = 'ds-count';
    return clock;
    } catch {
    return null;
    }
    }
    function steady(element, fromText, toText) {
    const busy = element.getAttribute?.('aria-busy') ?? null;
    for (const name of ['min-width', 'font-variant-numeric']) own(element, 'props', name);
    own(element, 'attrs', 'aria-busy');
    element.setAttribute?.('aria-busy', 'true');
    const style = computed(element);
    const inline = element.style;
    const minWidth = typeof inline?.minWidth === 'string' ? inline.minWidth : null;
    if (style && inline && typeof style.fontVariantNumeric === 'string' && !style.fontVariantNumeric.includes('tabular-nums')) {
    inline.fontVariantNumeric = style.fontVariantNumeric === 'normal' ? 'tabular-nums' : `${style.fontVariantNumeric} tabular-nums`;
    }
    if (style && minWidth !== null && style.display !== 'inline' && typeof element.getBoundingClientRect === 'function') {
    element.textContent = fromText;
    const before = element.getBoundingClientRect().width;
    element.textContent = toText;
    const after = element.getBoundingClientRect().width;
    const box = style.boxSizing === 'border-box' ? 0
    : ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((sum, key) => sum + (parseFloat(style[key]) || 0), 0);
    inline.minWidth = `${Math.max(before, after) - box}px`;
    }
    return () => {
    if (minWidth !== null) inline.minWidth = minWidth;
    tidyStyle(element);
    if (busy === null) element.removeAttribute?.('aria-busy');
    else element.setAttribute?.('aria-busy', busy);
    for (const name of ['min-width', 'font-variant-numeric']) disown(element, 'props', name);
    disown(element, 'attrs', 'aria-busy');
    };
    }
    function countUp(element, to, options = {}) {
    if (!element) return doneHandle();
    const format = options.format || ((value) => String(Math.round(value)));
    const target = Number(to);
    const running = counts.get(element);
    if (running && running.to === target && options.from === undefined) return running.handle;
    const cached = shownValues.get(element);
    let start = options.from !== undefined ? Number(options.from) : cached ?? 0;
    const text = String(element.textContent ?? '');
    if (!running && options.from === undefined && cached !== undefined && text !== format(cached)) {
    const parsed = Number(text.replace(/[^\d.-]/g, ''));
    start = text.trim() && Number.isFinite(parsed) && format(parsed) === text ? parsed : target;
    }
    const from = Number.isFinite(start) ? start : 0;
    running?.stop(false);
    if (!Number.isFinite(target)) {
    element.textContent = format(target);
    shownValues.delete(element);
    return doneHandle();
    }
    const write = (value) => {
    element.textContent = format(value);
    shownValues.set(element, value);
    };
    if (from === target) {
    if (element.textContent !== format(target)) write(target);
    else shownValues.set(element, target);
    return doneHandle();
    }
    const duration = options.duration ?? motionDuration(element, '--ds-dur-glide');
    const win = 'win' in options ? options.win : windowOf(element);
    if (!(duration > 0) || typeof win?.requestAnimationFrame !== 'function' || element.isConnected === false) {
    write(target);
    return doneHandle();
    }
    const ease = curve(motionEasing(element, '--ds-ease-value'));
    const undo = steady(element, format(from), format(target));
    const clock = startClock(element, duration);
    let began = (null);
    let frame = 0;
    let resolve = () => {};
    const finished = new Promise((done) => { resolve = done; });
    const run = {
    to: target,
    handle: { cancel: () => { if (counts.get(element) === run) run.stop(true); }, finished },
    stop(final) {
    win.cancelAnimationFrame?.(frame);
    clock?.cancel();
    if (counts.get(element) === run) counts.delete(element);
    if (final) write(target);
    undo();
    resolve();
    },
    };
    counts.set(element, run);
    const tick = ( time) => {
    if (counts.get(element) !== run) return;
    let elapsed;
    if (clock) {
    elapsed = clock.playState === 'idle' ? duration : Number(clock.currentTime) || 0;
    } else {
    began ??= time;
    elapsed = time - began;
    }
    const progress = Math.min(1, Math.max(0, elapsed / duration));
    if (progress >= 1 || element.isConnected === false) {
    run.stop(true);
    return;
    }
    write(from + (target - from) * Math.min(1, Math.max(0, ease(progress))));
    frame = win.requestAnimationFrame(tick);
    };
    write(from);
    frame = win.requestAnimationFrame(tick);
    return run.handle;
    }
    const round = (value) => Math.round(value * 100) / 100;
    function edges(rect) {
    return { left: rect.left, top: rect.top, right: rect.right ?? rect.left + rect.width, bottom: rect.bottom ?? rect.top + rect.height };
    }
    const CLIP_BLEED = 'calc(-1 * var(--ds-space-6, 24px))';
    const CLIP_FROM = {
    bottom: `${CLIP_BLEED} ${CLIP_BLEED} 100% ${CLIP_BLEED}`,
    top: `100% ${CLIP_BLEED} ${CLIP_BLEED} ${CLIP_BLEED}`,
    right: `${CLIP_BLEED} 100% ${CLIP_BLEED} ${CLIP_BLEED}`,
    left: `${CLIP_BLEED} ${CLIP_BLEED} ${CLIP_BLEED} 100%`,
    };
    function originFrom(trigger, panel) {
    const box = edges(panel.getBoundingClientRect());
    const anchor = typeof (trigger)?.getBoundingClientRect === 'function'
    ? edges( (trigger).getBoundingClientRect())
    : (() => {
    const point = (trigger);
    return { left: point.x, right: point.x, top: point.y, bottom: point.y };
    })();
    const x = Math.min(box.right - box.left, Math.max(0, (anchor.left + anchor.right) / 2 - box.left));
    const y = Math.min(box.bottom - box.top, Math.max(0, (anchor.top + anchor.bottom) / 2 - box.top));
    const gaps = { bottom: box.top - anchor.bottom, top: anchor.top - box.bottom, right: box.left - anchor.right, left: anchor.left - box.right };
    const side = (['top', 'right', 'left'].reduce((best, name) => (gaps[name] > gaps[best] ? name : best), 'bottom'));
    const origin = `${round(x)}px ${round(y)}px`;
    const radius = computed(panel)?.borderRadius || '0px';
    const style = (panel).style;
    style.setProperty('--ds-motion-origin', origin);
    style.setProperty('--ds-clip-from', `inset(${CLIP_FROM[side]} round ${radius})`);
    return { origin, side };
    }
    function swapSlot(element) {
    element.classList.add('ds-swap');
    const nodes = Array.from(element.childNodes ?? []);
    if (nodes.some((node) => node.nodeType === 3 && node.nodeValue.trim())) {
    const span = element.ownerDocument.createElement('span');
    for (const node of nodes) if (node.nodeType !== 1 || !node.hasAttribute('data-ds-leaving')) span.append(node);
    element.append(span);
    }
    return Array.from(element.children).filter((child) => !child.hasAttribute('data-ds-leaving'));
    }
    function setStyles(element, styles) {
    for (const [name, value] of Object.entries(styles)) element.style.setProperty(name, value);
    }
    const swappedOut = new WeakSet();
    function swap(element, outgoing, incoming, enterHooks, leaveHooks) {
    own(element, 'classes', 'ds-swap');
    const leaving = outgoing.map((child) => {
    child.setAttribute('data-ds-leaving', '');
    child.setAttribute('aria-hidden', 'true');
    swappedOut.add(child);
    setStyles(child, leaveHooks);
    return leave(child);
    });
    if (swappedOut.delete(incoming)) {
    incoming.removeAttribute('data-ds-leaving');
    incoming.removeAttribute('aria-hidden');
    for (const name of ['--ds-leave-keyframes', '--ds-leave-duration', '--ds-leave-easing']) incoming.style.removeProperty(name);
    }
    setStyles(incoming, enterHooks);
    element.append(incoming);
    const entering = enter(incoming);
    const gen = stateOf(incoming).gen;
    return Promise.all([entering, ...leaving]).then(() => {
    disown(element, 'classes', 'ds-swap');
    if (stateOf(incoming).gen !== gen) return;
    for (const name of Object.keys(enterHooks)) incoming.style.removeProperty(name);
    for (const name of ['style', 'class']) if (incoming.getAttribute(name) === '') incoming.removeAttribute(name);
    });
    }
    const rollHolds = new WeakMap();
    function rollNow(element, value) {
    const current = swapSlot(element);
    if (current.length === 1 && current[0].textContent === value) return Promise.resolve();
    const line = element.ownerDocument.createElement('span');
    line.textContent = value;
    return swap(element, current, line,
    { '--ds-enter-keyframes': 'ds-fade-in, ds-roll-in', '--ds-enter-delay': 'calc(var(--ds-dur-fast) / 2)' },
    { '--ds-leave-keyframes': 'ds-fade-out, ds-roll-out' });
    }
    function roll(element, text, options = {}) {
    if (!element) return Promise.resolve();
    const value = String(text ?? '');
    if (!options.hold) {
    const held = rollHolds.get(element);
    if (held) {
    clearTimeout(held.timer);
    held.resolve?.();
    rollHolds.delete(element);
    }
    return rollNow(element, value);
    }
    const state = rollHolds.get(element) ?? { shownAt: -Infinity, text: null, timer: 0, waiting: null, resolve: null };
    rollHolds.set(element, state);
    const hold = motionDuration(element, '--ds-hold-status');
    const run = () => {
    const next = (state.text);
    const resolve = state.resolve;
    state.text = null;
    state.timer = 0;
    state.waiting = null;
    state.resolve = null;
    const shown = swapSlot(element);
    if (!(shown.length === 1 && shown[0].textContent === next)) state.shownAt = Date.now();
    const done = rollNow(element, next);
    done.then(() => resolve?.(), () => resolve?.());
    return done;
    };
    state.text = value;
    if (state.waiting) return state.waiting;
    const left = state.shownAt + hold - Date.now();
    if (left <= 0) return run();
    state.waiting = new Promise((resolve) => { state.resolve = resolve; });
    state.timer = setTimeout(run, left);
    return state.waiting;
    }
    function showsB(element) {
    const swap = element.getAttribute('data-swap');
    if (swap) return swap === 'b';
    return Boolean(element.parentElement?.closest('[aria-pressed="true"]'));
    }
    function iconFace(element, which) {
    const existing = Array.from(element.children).find((child) => child.classList.contains(`ds-icon-swap__${which}`));
    if (existing) return existing;
    const face = element.ownerDocument.createElement('span');
    face.className = `ds-icon-swap__${which}`;
    return face;
    }
    function iconNode(element, next) {
    if (next?.nodeType) return next;
    const template = element.ownerDocument.createElement('template');
    template.innerHTML = String(next ?? '').trim();
    const nodes = Array.from(template.content.childNodes);
    if (nodes.length === 1) return nodes[0];
    const span = element.ownerDocument.createElement('span');
    span.append(...nodes);
    return span;
    }
    function iconSwap(element, next) {
    own(element, 'classes', 'ds-icon-swap');
    own(element, 'attrs', 'data-swap');
    element.classList.add('ds-icon-swap');
    const a = iconFace(element, 'a');
    const b = iconFace(element, 'b');
    const built = !a.parentNode || !b.parentNode;
    if (!a.parentNode) {
    for (const node of Array.from(element.childNodes)) if (node !== b) a.append(node);
    element.prepend(a);
    }
    if (!b.parentNode) element.append(b);
    const shown = showsB(element) ? b : a;
    const target = next === a || next === b ? next : shown === a ? b : a;
    if (next !== a && next !== b) {
    const node = iconNode(element, next);
    const same = target.childNodes.length === 1 && target.firstChild.isEqualNode?.(node);
    if (!same) {
    target.replaceChildren(node);
    flushStyle(target);
    }
    }
    if (built) for (const face of [a, b]) flushStyle(face);
    element.setAttribute('data-swap', target === b ? 'b' : 'a');
    const release = () => {
    disown(element, 'classes', 'ds-icon-swap');
    disown(element, 'attrs', 'data-swap');
    };
    return settled(element, { transitions: true, subtree: true }).then(release, (error) => {
    release();
    throw error;
    });
    }
    function crossfade(element, next, options = {}) {
    const kind = options.kind ?? 'text';
    if (kind !== 'text' && kind !== 'icon') throw new TypeError(`crossfade(): unknown kind "${kind}"`);
    if (!element) return Promise.resolve();
    if (kind === 'icon') return iconSwap(element, next);
    const current = swapSlot(element);
    let incoming = (next);
    if (incoming?.nodeType !== 1) {
    const span = element.ownerDocument.createElement('span');
    if (incoming?.nodeType) span.append(incoming);
    else span.textContent = String(incoming ?? '');
    incoming = span;
    }
    return swap(element, current.filter((child) => child !== incoming), incoming,
    { '--ds-enter-keyframes': 'ds-fade-in', '--ds-enter-duration': 'var(--ds-dur-fast)', '--ds-enter-easing': 'var(--ds-ease-in-out)' },
    { '--ds-leave-duration': 'var(--ds-dur-instant)' });
    }
    const flips = new WeakMap();
    const glides = new WeakMap();
    const raisedItems = new WeakMap();
    function flipState(container) {
    let state = flips.get(container);
    if (!state) {
    state = { pointer: '', over: false, guarded: false, items: undefined, queued: null, timer: 0, waiters: [], lifted: 0, position: null, minHeight: null, align: null, sizeGlide: null, raised: 0, isolation: null, backed: false };
    flips.set(container, state);
    }
    return state;
    }
    function flipItems(container, selector) {
    const list = selector ? Array.from(container.querySelectorAll(selector)) : Array.from(container.children ?? []);
    return list.filter((item) => !item.hasAttribute('data-ds-keep') && !item.hasAttribute('data-ds-leaving'));
    }
    function isFlipItem(container, node, selector) {
    if (node?.nodeType !== 1 || node.hasAttribute('data-ds-keep')) return false;
    return selector ? Boolean(node.matches?.(selector)) && container.contains(node) : node.parentElement === container;
    }
    function offscreen(rect, view) {
    const width = view.innerWidth;
    const height = view.innerHeight;
    if (!(width > 0) || !(height > 0)) return false;
    const box = edges(rect);
    return box.bottom <= 0 || box.right <= 0 || box.top >= height || box.left >= width;
    }
    function liftable(node, display) {
    if (node.tagName === 'TR') return false;
    return !(display ?? computed(node)?.display ?? '').startsWith('table');
    }
    function lift(container, node, rect, frame, state, box = liftBox(container)) {
    if (!state.lifted) {
    state.position = null;
    if (box.position === 'static') {
    state.position = container.style.position;
    own(container, 'props', 'position');
    container.style.position = 'relative';
    }
    }
    state.lifted += 1;
    const at = edges(rect);
    const left = at.left - frame.left - box.borderLeft + box.scrollLeft;
    const top = at.top - frame.top - box.borderTop + box.scrollTop;
    setStyles(node, {
    position: 'absolute',
    left: `${round(left)}px`,
    top: `${round(top)}px`,
    width: `${round(at.right - at.left)}px`,
    height: `${round(at.bottom - at.top)}px`,
    'min-width': '0',
    'max-width': 'none',
    'min-height': '0',
    'max-height': 'none',
    margin: '0',
    'box-sizing': 'border-box',
    });
    }
    function liftBox(container) {
    const style = computed(container);
    return {
    position: style?.position ?? '',
    borderLeft: parseFloat(style?.borderLeftWidth) || 0,
    borderTop: parseFloat(style?.borderTopWidth) || 0,
    scrollLeft: container.scrollLeft || 0,
    scrollTop: container.scrollTop || 0,
    };
    }
    function lazyLiftBox(container) {
    let box = null;
    return () => (box ??= liftBox(container));
    }
    function paints(colour) {
    if (!colour || colour === 'transparent') return false;
    const inner = /\(([^)]*)\)/.exec(colour)?.[1] ?? '';
    const slash = inner.split('/');
    if (slash.length > 1) return parseFloat(slash[1]) > 0;
    const parts = inner.split(',');
    return parts.length === 4 ? parseFloat(parts[3]) > 0 : true;
    }
    function backdropOf(element) {
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
    const colour = computed(node)?.backgroundColor;
    if (paints(colour)) return colour;
    }
    return '';
    }
    function backContainer(container, state, known) {
    if (state.backed) return;
    state.backed = true;
    own(container, 'attrs', 'data-ds-glide');
    own(container, 'props', '--ds-flip-backdrop');
    const backdrop = known ?? backdropOf(container);
    if (backdrop) container.style.setProperty('--ds-flip-backdrop', backdrop);
    container.setAttribute('data-ds-glide', '');
    }
    function unbackContainer(container, state) {
    if (!state.backed) return;
    state.backed = false;
    container.removeAttribute('data-ds-glide');
    container.style.removeProperty('--ds-flip-backdrop');
    tidyStyle(container);
    disown(container, 'attrs', 'data-ds-glide');
    disown(container, 'props', '--ds-flip-backdrop');
    }
    function raise(container, state, item, rank, layers, known = {}) {
    if (!raisedItems.has(item)) {
    raisedItems.set(item, { position: item.style.position, zIndex: item.style.zIndex, container });
    for (const name of ['position', 'z-index']) own(item, 'props', name);
    if ((known.position ?? computed(item)?.position) === 'static') item.style.position = 'relative';
    if (!state.raised) {
    state.isolation = container.style.isolation ?? '';
    own(container, 'props', 'isolation');
    container.style.isolation = 'isolate';
    backContainer(container, state, known.backdrop);
    }
    state.raised += 1;
    }
    item.style.zIndex = layers ? String(Math.max(layers.base + 1, Math.min(layers.base + 1 + rank, layers.sticky - 1))) : 'calc(var(--ds-z-raised) + 1)';
    }
    function glideLayers(container) {
    const style = computed(container);
    const read = (name) => parseInt(style?.getPropertyValue(name) ?? '', 10);
    const raised = read('--ds-z-raised');
    if (!Number.isFinite(raised)) return null;
    const pinned = read('--ds-z-pinned');
    const sticky = read('--ds-z-sticky');
    const base = Math.max(raised, Number.isFinite(pinned) ? pinned : raised + 1);
    return { base, sticky: Number.isFinite(sticky) ? sticky : Infinity };
    }
    function lower(item) {
    const saved = raisedItems.get(item);
    if (!saved) return;
    raisedItems.delete(item);
    item.style.position = saved.position;
    item.style.zIndex = saved.zIndex;
    tidyStyle(item);
    for (const name of ['position', 'z-index']) disown(item, 'props', name);
    const state = flipState(saved.container);
    state.raised = Math.max(0, state.raised - 1);
    if (!state.raised && state.isolation !== null) {
    saved.container.style.isolation = state.isolation;
    tidyStyle(saved.container);
    state.isolation = null;
    disown(saved.container, 'props', 'isolation');
    }
    if (!state.raised) unbackContainer(saved.container, state);
    }
    function heightOf(element) {
    const box = edges(element.getBoundingClientRect());
    return box.bottom - box.top;
    }
    function minHeightFor(container, height) {
    const style = computed(container);
    if (!style || style.boxSizing === 'border-box') return height;
    return height - ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((sum, key) => sum + (parseFloat(style[key]) || 0), 0);
    }
    function holdSize(container, state, height) {
    if (state.minHeight !== null) return;
    state.minHeight = container.style.minHeight ?? '';
    own(container, 'props', 'min-height');
    const style = computed(container);
    const display = style?.display ?? '';
    const alignContent = style?.alignContent ?? '';
    container.style.minHeight = `${round(Math.max(0, minHeightFor(container, height)))}px`;
    if (state.align === null && /grid/.test(display) && /^(normal|stretch)$/.test(alignContent)) {
    state.align = container.style.alignContent ?? '';
    own(container, 'props', 'align-content');
    container.style.alignContent = 'start';
    }
    }
    function releaseAlign(container, state) {
    if (state.align === null || state.minHeight !== null || state.sizeGlide) return;
    container.style.alignContent = state.align;
    tidyStyle(container);
    state.align = null;
    disown(container, 'props', 'align-content');
    }
    function glideSize(container, state, from) {
    const to = heightOf(container);
    if (from - to < 0.5 || typeof container.animate !== 'function') {
    releaseAlign(container, state);
    return Promise.resolve();
    }
    const animation = animateSafe(container, [
    { minHeight: `${round(minHeightFor(container, from))}px` },
    { minHeight: `${round(minHeightFor(container, to))}px` },
    ], {
    id: 'ds-flip-size',
    duration: travelDuration(container, from - to),
    easing: motionEasing(container, '--ds-ease-out'),
    }, '--ds-ease-out');
    animation.id = 'ds-flip-size';
    state.sizeGlide = animation;
    return animation.finished.then(() => {
    if (state.sizeGlide === animation) state.sizeGlide = null;
    releaseAlign(container, state);
    }, () => {});
    }
    function landed(container, state, glide = true) {
    state.lifted = Math.max(0, state.lifted - 1);
    if (state.lifted) return Promise.resolve();
    if (state.position !== null) {
    container.style.position = state.position;
    tidyStyle(container);
    state.position = null;
    disown(container, 'props', 'position');
    }
    if (state.minHeight === null) return Promise.resolve();
    const from = heightOf(container);
    container.style.minHeight = state.minHeight;
    tidyStyle(container);
    state.minHeight = null;
    disown(container, 'props', 'min-height');
    if (glide) return glideSize(container, state, from);
    releaseAlign(container, state);
    return Promise.resolve();
    }
    function measure(container, selector) {
    const before = new Map();
    for (const item of flipItems(container, selector)) before.set(item, item.getBoundingClientRect());
    const displays = new Map();
    for (const item of before.keys()) if (item.tagName !== 'TR') displays.set(item, computed(item)?.display ?? '');
    const childrenOf = new Set(Array.from(before.keys()).filter((item) => item.parentElement === container));
    const nextOf = new Map(Array.from(container.childNodes, (node) => [node, node.nextSibling]));
    const active = activeIn(container);
    const owner = active && container.contains?.(active) ? Array.from(before.keys()).find((item) => item.contains(active)) ?? null : null;
    return { before, displays, childrenOf, nextOf, frame: edges(container.getBoundingClientRect()), focus: owner ? { active, owner } : null };
    }
    const FOCUSABLE = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]';
    function focusable(element) {
    if (!element || typeof element.focus !== 'function' || element.isConnected === false) return false;
    if (element.disabled || element.closest?.('[inert], [data-ds-leaving], [hidden]')) return false;
    if (typeof element.getClientRects === 'function' && !element.getClientRects().length) return false;
    return true;
    }
    function itemGone(item, removed) {
    return item.isConnected === false || removed.some((entry) => entry.node === item) || Boolean(item.hasAttribute?.('data-ds-leaving'));
    }
    const TRANSIENT_CLASS = /^ds-(pressed|btn--done|enter|leave)(--|$)/;
    function lastingClasses(element) {
    const value = typeof element?.getAttribute === 'function' ? element.getAttribute('class') ?? '' : '';
    return value.split(/\s+/).filter((name) => name && !TRANSIENT_CLASS.test(name)).sort().join(' ');
    }
    function focusablesIn(item) {
    const own = item.matches?.(FOCUSABLE) ? [item] : [];
    return [...own, ...Array.from(item.querySelectorAll?.(FOCUSABLE) ?? [])].filter(focusable);
    }
    function twinIn(item, old) {
    const classes = lastingClasses(old);
    if (!classes) return null;
    return focusablesIn(item).find((element) => lastingClasses(element) === classes) ?? null;
    }
    function firstIn(item) {
    return focusablesIn(item)[0] ?? null;
    }
    function refocusAfter(container, focus, order, removed, refocus) {
    if (!focus || refocus === false) return;
    const { active, owner } = focus;
    if (!itemGone(owner, removed)) return;
    const now = activeIn(container);
    const doc = container.ownerDocument;
    const lost = !now || now === doc?.body || now === doc?.documentElement || owner.contains(now) || now === active && active.isConnected === false;
    if (!lost) return;
    const index = order.indexOf(owner);
    const alive = (item) => !itemGone(item, removed) && !item.hasAttribute?.('data-ds-keep');
    const bearing = (items) => items.filter((item) => alive(item) && firstIn(item));
    const later = bearing(order.slice(index + 1));
    const earlier = bearing(order.slice(0, index).reverse());
    let target = null;
    for (let step = 0; !target && step < Math.max(later.length, earlier.length); step += 1) {
    target = (later[step] && twinIn(later[step], active)) || (earlier[step] && twinIn(earlier[step], active)) || null;
    }
    const nearest = later[0] ?? earlier[0];
    if (!target && nearest) target = firstIn(nearest);
    if (!target && refocus !== true && refocus !== undefined) {
    const fallback = typeof refocus === 'function' ? refocus() : refocus;
    if (focusable(fallback)) target = fallback;
    }
    target?.focus({ preventScroll: true });
    }
    function runFlip(container, mutate, options, state, first) {
    const selector = options.items;
    const max = options.max ?? 50;
    const view = windowOf(container);
    const { before, displays, childrenOf, nextOf, frame, focus } = first ?? measure(container, selector);
    const box = lazyLiftBox(container);
    const firstHeight = frame.bottom - frame.top;
    for (const item of before.keys()) {
    glides.get(item)?.cancel();
    glides.delete(item);
    lower(item);
    }
    const sizing = state.sizeGlide;
    sizing?.cancel();
    state.sizeGlide = null;
    const inserted = [];
    const removed = [];
    mutate({
    holdOrder: false,
    ...(typeof options.onKeep === 'function' ? { onKeep: options.onKeep } : {}),
    onInsert(node) {
    if (isFlipItem(container, node, selector)) inserted.push(node);
    },
    onRemove(node) {
    const rect = before.get(node);
    if (!rect || !liftable(node, displays?.get(node))) return undefined;
    holdSize(container, state, firstHeight);
    lift(container, node, rect, frame, state, box());
    return new Promise((resolve) => removed.push({ node, resolve }));
    },
    });
    const back = Array.from(before.keys()).filter((item) => !item.parentNode && childrenOf.has(item));
    for (const item of back) item.setAttribute('data-ds-moving', '');
    for (const item of [...back].reverse()) {
    let next = nextOf.get(item) ?? null;
    while (next && next.parentNode !== container) next = nextOf.get(next) ?? null;
    container.insertBefore(item, next);
    }
    if (back.length) void computed(back[0])?.opacity;
    for (const item of back) item.removeAttribute('data-ds-moving');
    for (const item of back) {
    const rect = before.get(item);
    if (!liftable(item, displays?.get(item))) {
    item.remove();
    continue;
    }
    holdSize(container, state, firstHeight);
    lift(container, item, rect, frame, state, box());
    removed.push({ node: item, resolve() {} });
    }
    refocusAfter(container, focus, Array.from(before.keys()), [...removed, ...back.filter((item) => !item.parentNode).map((node) => ({ node }))], options.refocus);
    for (const item of flipItems(container, selector)) {
    if (before.has(item) || inserted.includes(item) || removed.some((entry) => entry.node === item)) continue;
    if (item.getAnimations?.().some((animation) => animation.playState !== 'finished' && !scrollDriven(animation))) continue;
    inserted.push(item);
    }
    const moves = [];
    for (const item of flipItems(container, selector)) {
    const first = before.get(item);
    if (!first) continue;
    const last = item.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    if (offscreen(first, view) && offscreen(last, view)) continue;
    moves.push({ item, dx, dy });
    }
    const gone = (entry, glide = true) => {
    entry.node.remove();
    entry.resolve();
    return landed(container, state, glide);
    };
    if (moves.length > max) {
    removed.forEach((entry) => gone(entry, false));
    return Promise.resolve();
    }
    const resizing = sizing && state.minHeight === null ? glideSize(container, state, firstHeight) : Promise.resolve();
    const easing = motionEasing(container, '--ds-ease-spatial');
    const layers = moves.length ? glideLayers(container) : null;
    const medium = moves.length ? motionDuration(container, '--ds-dur-medium') : 0;
    const slow = moves.length ? motionDuration(container, '--ds-dur-slow') : 0;
    const ranked = moves.map((move) => ({ move, distance: Math.hypot(move.dx, move.dy) }))
    .sort((a, b) => (a.distance - b.distance) || (a.move.dy - b.move.dy));
    const positions = ranked.map(({ move }) => computed(move.item)?.position);
    const backdrop = ranked.length && !state.raised && !state.backed ? backdropOf(container) : undefined;
    ranked.forEach(({ move }, rank) => raise(container, state, move.item, rank, layers, { position: positions[rank], backdrop }));
    const running = moves.map(({ item, dx, dy }) => {
    const animation = animateSafe(item, [{ translate: `${round(dx)}px ${round(dy)}px` }, { translate: '0px 0px' }], {
    id: 'ds-flip',
    duration: travelBetween(medium, slow, Math.hypot(dx, dy)),
    easing,
    composite: 'add',
    }, '--ds-ease-spatial');
    animation.id = 'ds-flip';
    glides.set(item, animation);
    const ended = () => {
    if (glides.get(item) === animation) glides.delete(item);
    if (!glides.has(item)) lower(item);
    };
    return animation.finished.then(ended, (error) => {
    ended();
    throw error;
    });
    });
    const entering = enterEach(inserted, 'fade');
    const leaving = leaveEach(removed.map((entry) => entry.node)).map((done, index) => done.then(() => gone(removed[index])));
    return Promise.allSettled([...running, ...entering, ...leaving, resizing]).then(() => {});
    }
    function held(container, state) {
    if (state.over && (state.pointer === 'mouse' || state.pointer === 'pen')) return true;
    const active = activeIn(container);
    if (!active || active === container || !container.contains(active)) return false;
    return flipItems(container, state.items).some((item) => item.contains(active));
    }
    function flush(container, mutate, options, state, first) {
    const steps = (state.queued?.steps ?? []).map((step) => step.mutate);
    const waiters = state.waiters;
    clearTimeout(state.timer);
    state.timer = 0;
    state.queued = null;
    state.waiters = [];
    if (mutate && !steps.includes(mutate)) steps.push(mutate);
    const all = steps.length === 1 ? steps[0] : ( hooks) => {
    for (const step of steps) step(hooks);
    };
    const done = runFlip(container, all, options, state, first);
    for (const resolve of waiters) resolve(done);
    return done;
    }
    function release(container, state, force = false) {
    if (!state.queued || (!force && held(container, state))) return;
    flush(container, null, state.queued.options, state);
    }
    function sameItems(a, b) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
    }
    function watchLive(container, state) {
    if (state.guarded) return;
    state.guarded = true;
    try {
    if (container.matches(':hover') && windowOf(container).matchMedia('(hover: hover)').matches) {
    state.over = true;
    state.pointer = 'mouse';
    }
    } catch {
    }
    container.addEventListener('pointerover', ( event) => {
    state.over = true;
    state.pointer = event.pointerType || 'mouse';
    });
    container.addEventListener('pointerleave', () => {
    state.over = false;
    release(container, state);
    });
    container.addEventListener('focusout', ( event) => {
    if (event.relatedTarget && container.contains(event.relatedTarget)) return;
    setTimeout(() => release(container, state), 0);
    });
    }
    function flip(container, mutate, options = {}) {
    if (!container || typeof mutate !== 'function') return Promise.resolve();
    const state = flipState(container);
    if (options.live) {
    state.items = options.items;
    watchLive(container, state);
    if (held(container, state)) {
    const queued = state.queued ?? (state.queued = { steps: [], options });
    queued.options = options;
    if (mutate.length === 0) {
    queued.steps.push({ mutate, aware: false });
    } else {
    const first = measure(container, state.items);
    mutate({ holdOrder: true, ...(typeof options.onKeep === 'function' ? { onKeep: options.onKeep } : {}), onInsert() {}, onRemove() { return undefined; } });
    queued.steps = queued.steps.filter((step) => !step.aware);
    if (!sameItems(Array.from(first.before.keys()), flipItems(container, state.items))) {
    return flush(container, null, options, state, first);
    }
    queued.steps.push({ mutate, aware: true });
    }
    if (!state.timer) state.timer = setTimeout(() => release(container, state, true), options.hold ?? 2000);
    return new Promise((resolve) => state.waiters.push(resolve));
    }
    }
    return flush(container, mutate, options, state);
    }
    const sortables = new WeakMap();
    const sortRegions = new WeakMap();
    function speakPosition(list, text) {
    const host = list.closest?.('dialog, .ds-dialog, .ds-sheet') ?? list.closest?.('.ds-theme') ?? list.ownerDocument?.body;
    if (!host || !text) return;
    let region = sortRegions.get(host);
    if (!region || !region.isConnected) {
    region = list.ownerDocument.createElement('div');
    region.className = 'ds-sr';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('data-ds-keep', '');
    host.append(region);
    sortRegions.set(host, region);
    }
    region.textContent = '';
    const target = region;
    setTimeout(() => { target.textContent = text; }, 0);
    }
    function sortable(list, options = {}) {
    if (!list?.ownerDocument) return { destroy() {} };
    const existing = sortables.get(list);
    if (existing) return existing.handle;
    const handleSelector = options.handle ?? '.ds-grip';
    const selector = options.items;
    const items = () => flipItems(list, selector);
    const others = selector ? `:is(${selector}):not([data-ds-dragging])` : ':scope > :not([data-ds-dragging])';
    const itemOf = (node) => items().find((item) => item.contains(node)) ?? null;
    const say = (item) => {
    const order = items();
    const text = (options.announce ?? ((index, count) => `Moved to position ${index} of ${count}`))(order.indexOf(item) + 1, order.length);
    speakPosition(list, text);
    };
    const changed = (before) => {
    const after = items();
    if (!sameItems(before, after)) options.onChange?.(after, before);
    };
    const place = (item, reference) => {
    const parent = reference?.parentNode ?? item.parentNode;
    const focused = activeIn(item);
    const keep = focused && item.contains(focused) ? focused : null;
    if (typeof parent.moveBefore === 'function') {
    try {
    parent.moveBefore(item, reference);
    } catch {
    parent.insertBefore(item, reference);
    }
    } else parent.insertBefore(item, reference);
    if (keep && activeIn(item) !== keep) keep.focus({ preventScroll: true });
    };
    const onKey = ( event) => {
    const handle = event.target?.closest?.(handleSelector);
    if (!handle || !list.contains(handle) || event.altKey || event.ctrlKey || event.metaKey) return;
    const item = itemOf(handle);
    if (!item) return;
    const order = items();
    const index = order.indexOf(item);
    const to = { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: order.length - 1 }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    if (to < 0 || to >= order.length || to === index) return;
    const before = order.slice();
    flip(list, () => place(item, to > index ? order[to].nextSibling : order[to]), { items: selector });
    changed(before);
    say(item);
    };
    let drag = null;
    const ending = new Map();
    const finish = (item) => {
    const end = ending.get(item);
    if (!end) return;
    ending.delete(item);
    clearTimeout(end.timer);
    item.removeAttribute('data-ds-dragging');
    item.style.zIndex = end.z;
    tidyStyle(item);
    disown(item, 'attrs', 'data-ds-dragging');
    for (const name of ['translate', 'z-index']) disown(item, 'props', name);
    };
    const layoutTop = (item) => item.offsetTop ?? 0;
    const middle = (item) => layoutTop(item) + (item.offsetHeight ?? 0) / 2;
    const onDown = ( event) => {
    if (drag || event.button !== 0) return;
    const handle = event.target?.closest?.(handleSelector);
    if (!handle || !list.contains(handle)) return;
    const item = itemOf(handle);
    if (!item) return;
    event.preventDefault();
    handle.setPointerCapture?.(event.pointerId);
    for (const animation of item.getAnimations?.() ?? []) if (animation.id === 'ds-sort') animation.cancel();
    finish(item);
    drag = { item, handle, pointer: event.pointerId, startY: event.clientY, dy: 0, before: items(), z: item.style.zIndex };
    own(item, 'attrs', 'data-ds-dragging');
    for (const name of ['translate', 'z-index']) own(item, 'props', name);
    item.setAttribute('data-ds-dragging', '');
    const sticky = parseInt(computed(list)?.getPropertyValue('--ds-z-sticky') ?? '', 10);
    item.style.zIndex = Number.isFinite(sticky) ? String(sticky - 1) : 'calc(var(--ds-z-sticky) - 1)';
    };
    const onMove = ( event) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const { item } = drag;
    drag.dy = event.clientY - drag.startY;
    item.style.translate = `0px ${round(drag.dy)}px`;
    const order = items();
    const index = order.indexOf(item);
    const top = layoutTop(item) + drag.dy;
    const bottom = top + (item.offsetHeight ?? 0);
    let target = index;
    while (target > 0 && top < middle(order[target - 1])) target -= 1;
    while (target < order.length - 1 && bottom > middle(order[target + 1])) target += 1;
    if (target === index) return;
    const from = layoutTop(item);
    flip(list, () => place(item, target > index ? order[target].nextSibling : order[target]), { items: others });
    const shift = layoutTop(item) - from;
    drag.startY += shift;
    drag.dy -= shift;
    item.style.translate = `0px ${round(drag.dy)}px`;
    say(item);
    };
    const onUp = ( event) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const { item, handle, dy, before, z } = drag;
    drag = null;
    handle.releasePointerCapture?.(event.pointerId);
    item.style.removeProperty('translate');
    if (Math.abs(dy) >= 0.5 && typeof item.animate === 'function') {
    const glide = animateSafe(item, [{ translate: `0px ${round(dy)}px` }, { translate: '0px 0px' }], {
    id: 'ds-sort',
    duration: travelDuration(list, dy),
    easing: motionEasing(list, '--ds-ease-spatial'),
    }, '--ds-ease-spatial');
    glide.id = 'ds-sort';
    }
    item.setAttribute('data-ds-dragging', 'end');
    const timer = setTimeout(() => finish(item), Math.max(motionDuration(item, '--ds-dur-instant'), motionDuration(list, '--ds-dur-medium')));
    ending.set(item, { timer, z });
    changed(before);
    };
    list.addEventListener('keydown', onKey);
    list.addEventListener('pointerdown', onDown);
    list.addEventListener('pointermove', onMove);
    list.addEventListener('pointerup', onUp);
    list.addEventListener('pointercancel', onUp);
    const handle = {
    destroy() {
    if (sortables.get(list)?.handle !== handle) return;
    sortables.delete(list);
    for (const item of Array.from(ending.keys())) finish(item);
    list.removeEventListener('keydown', onKey);
    list.removeEventListener('pointerdown', onDown);
    list.removeEventListener('pointermove', onMove);
    list.removeEventListener('pointerup', onUp);
    list.removeEventListener('pointercancel', onUp);
    },
    };
    sortables.set(list, { handle });
    return handle;
    }
    const VIEW_TYPES = Object.freeze(['fade-through', 'forward', 'back', 'container']);
    const viewCalls = new WeakMap();
    const isElement = (value) => value?.nodeType === 1;
    const liftedNames = new WeakMap();
    const MODAL_OPEN = [
    '.ds-dialog[data-state="open"]:not(.ds-dialog--contained)',
    '.ds-sheet[data-state="open"]',
    'dialog.ds-dialog[open]:not(.ds-dialog--contained)',
    'dialog.ds-sheet[open]',
    '.ds-dialog:not(dialog, [hidden], [data-state], .ds-dialog--contained, .ds-dialog--hidden, .ds-dialog--closing)',
    '.ds-sheet[aria-modal="true"]:not(dialog, [hidden], [data-state], .ds-sheet--closing)',
    ].join(', ');
    const MODAL_DRAWER = '(max-width: 900px)';
    const FRAME_PARTS = '.ds-view, .ds-panel, .ds-drawer';
    function liftName(doc, element) {
    let lifted = liftedNames.get(doc);
    if (lifted?.has(element)) return;
    if (!lifted) liftedNames.set(doc, (lifted = new Map()));
    lifted.set(element, element.style.getPropertyValue('view-transition-name'));
    element.style.setProperty('view-transition-name', 'none');
    }
    function liftIndicatorNames(doc) {
    for (const pill of Array.from(doc.querySelectorAll?.('.ds-indicator') ?? [])) {
    const name = pill.style.getPropertyValue('view-transition-name');
    if (name && name !== 'none') liftName(doc, pill);
    }
    }
    function modalDrawer(doc) {
    if (doc.defaultView?.matchMedia?.(MODAL_DRAWER)?.matches !== true) return false;
    if (doc.querySelector?.('.ds-app[data-drawer-open]')) return true;
    const drawer = doc.querySelector?.('.ds-app .ds-drawer');
    return Boolean(drawer?.getAnimations?.().some((animation) => animation.playState === 'running'));
    }
    function liftFrameNames(doc) {
    if (!doc.querySelector?.(MODAL_OPEN) && !modalDrawer(doc)) return;
    for (const part of Array.from(doc.querySelectorAll?.(FRAME_PARTS) ?? [])) liftName(doc, part);
    }
    function liftExtraToasts(doc) {
    const regions = Array.from(doc.querySelectorAll?.('.ds-toasts') ?? []);
    const shown = regions.filter((region) => Array.from(region.children ?? []).some((child) => child.classList?.contains('ds-toast')));
    for (const region of shown.slice(1)) liftName(doc, region);
    }
    const forwardedClicks = new WeakSet();
    function forwardPresses(doc, call) {
    const root = doc.documentElement;
    const target = doc.defaultView ?? doc;
    if (typeof target?.addEventListener !== 'function') return () => {};
    const land = (x, y) => {
    const running = viewCalls.get(doc);
    if (running) {
    running.transition?.skipTransition?.();
    running.done.then(() => land(x, y));
    return;
    }
    let element = doc.elementFromPoint?.(x, y) ?? null;
    while (element && typeof element.click !== 'function') element = element.parentElement;
    if (element && element !== root) element.click();
    };
    const onClick = ( event) => {
    if (event.target !== root || forwardedClicks.has(event)) return;
    forwardedClicks.add(event);
    event.stopPropagation();
    land(event.clientX, event.clientY);
    };
    const onPointerDown = ( event) => {
    if (event.target !== root || event.button !== 0 || viewCalls.get(doc) !== call) return;
    event.stopPropagation();
    call.transition?.skipTransition?.();
    target.addEventListener('click', onClick, { capture: true, once: true });
    };
    const onClickDuring = ( event) => {
    if (viewCalls.get(doc) === call) onClick(event);
    };
    target.addEventListener('pointerdown', onPointerDown, true);
    target.addEventListener('click', onClickDuring, true);
    return () => {
    target.removeEventListener('pointerdown', onPointerDown, true);
    target.removeEventListener('click', onClickDuring, true);
    };
    }
    function panelWidth(doc) {
    const panel = doc.querySelector?.('.ds-theme .ds-panel');
    return panel?.getBoundingClientRect?.().width ?? null;
    }
    function restoreLiftedNames(doc) {
    const lifted = liftedNames.get(doc);
    if (!lifted) return;
    liftedNames.delete(doc);
    for (const [element, before] of lifted) {
    if (element.style.getPropertyValue('view-transition-name') !== 'none') continue;
    if (before) element.style.setProperty('view-transition-name', before);
    else element.style.removeProperty('view-transition-name');
    }
    }
    function clippedOnScreen(element) {
    const doc = element.ownerDocument;
    const view = doc?.defaultView;
    if (typeof element.getBoundingClientRect !== 'function' || typeof view?.getComputedStyle !== 'function' || !(view.innerWidth > 0)) return false;
    const rect = element.getBoundingClientRect();
    const shown = {
    left: Math.max(rect.left, 0),
    top: Math.max(rect.top, 0),
    right: Math.min(rect.right, view.innerWidth),
    bottom: Math.min(rect.bottom, view.innerHeight),
    };
    if (shown.right - shown.left < 1 || shown.bottom - shown.top < 1) return true;
    const stop = new Set([doc.documentElement, doc.body]);
    for (let node = element; node && !stop.has(node); node = node.parentElement) {
    const style = view.getComputedStyle(node);
    if (node !== element) {
    const box = node.getBoundingClientRect();
    const left = box.left + (node.clientLeft || 0);
    const top = box.top + (node.clientTop || 0);
    if (style.overflowX !== 'visible' && (shown.left < left - 1 || shown.right > left + node.clientWidth + 1)) return true;
    if (style.overflowY !== 'visible' && (shown.top < top - 1 || shown.bottom > top + node.clientHeight + 1)) return true;
    }
    if (style.position === 'fixed') break;
    }
    return false;
    }
    function nameContainer(call, element) {
    if (!call.names.has(element)) call.names.set(element, element.style.viewTransitionName ?? '');
    element.style.viewTransitionName = 'ds-container';
    }
    function unnameContainer(call, element) {
    if (!call.names.has(element)) return;
    element.style.viewTransitionName = call.names.get(element);
    call.names.delete(element);
    }
    function unnameAll(call) {
    for (const element of Array.from(call.names.keys())) unnameContainer(call, element);
    }
    function swapTarget(doc, result) {
    if (isElement(result)) return result;
    const view = doc?.querySelector?.('.ds-theme .ds-vt-view') ?? doc?.querySelector?.('.ds-theme .ds-view');
    for (const child of Array.from(view?.children ?? [])) {
    if (child.hasAttribute?.('data-ds-keep') || child.getAttribute?.('aria-hidden') === 'true') continue;
    return child;
    }
    return null;
    }
    function moveViewFocus(doc, before, result, option) {
    if (!option || !doc) return;
    const now = doc.activeElement;
    const app = before?.closest?.('.ds-app');
    const fromDrawer = Boolean(before?.closest?.('.ds-drawer')) && Boolean(app) && !app.hasAttribute('data-drawer-open')
    && doc.defaultView?.matchMedia?.(MODAL_DRAWER)?.matches === true;
    const lost = !now || now === doc.body || now === doc.documentElement || (before && before.isConnected === false) || fromDrawer
    || Boolean(now.closest?.('[inert], [data-ds-leaving]'));
    if (!lost) return;
    const incoming = isElement(result) ? result : null;
    let target = null;
    if (typeof option === 'function') target = option(incoming);
    else {
    const root = incoming ?? doc.querySelector?.('.ds-theme .ds-vt-view') ?? doc.querySelector?.('.ds-theme .ds-view');
    target = (root?.matches?.('h1[tabindex="-1"]') ? root : root?.querySelector?.('h1[tabindex="-1"]'))
    ?? root?.closest?.('.ds-view, .ds-vt-view') ?? root;
    }
    if (target && typeof target.focus === 'function' && target.isConnected !== false && !target.closest?.('[inert]')) target.focus({ preventScroll: true });
    }
    function swapView(doc, update, focus) {
    const before = doc?.activeElement ?? null;
    let result;
    try {
    result = update();
    } catch (error) {
    return Promise.reject(error);
    }
    return Promise.resolve(result).then((value) => {
    resyncScroll(doc);
    moveViewFocus(doc, before, value, focus);
    const target = swapTarget(doc, value);
    return target ? enter(target, 'swap') : undefined;
    });
    }
    function viewTransition(doc, update, type, from, focus) {
    const root = doc.documentElement;
    const before = doc.activeElement;
    const previous = viewCalls.get(doc);
    if (previous) {
    previous.transition?.skipTransition?.();
    unnameAll(previous);
    }
    const container = type === 'container' && isElement(from) && from.isConnected && !clippedOnScreen(from) ? from : null;
    const call = { transition: null, updated: Promise.resolve(), done: Promise.resolve(), names: new Map() };
    const latest = () => viewCalls.get(doc) === call;
    viewCalls.set(doc, call);
    root.setAttribute('data-ds-vt', type === 'container' && !container ? 'fade-through' : type);
    root.removeAttribute('data-ds-vt-morph');
    if (container) nameContainer(call, container);
    liftIndicatorNames(doc);
    liftFrameNames(doc);
    liftExtraToasts(doc);
    let settleUpdate = () => {};
    call.updated = new Promise((resolve) => { settleUpdate = resolve; });
    let watchdog = 0;
    let failure = (null);
    const run = async () => {
    watchdog = (setTimeout(() => call.transition?.skipTransition?.(), motionDuration(root, '--ds-dur-long')));
    try {
    if (container) unnameContainer(call, container);
    if (previous) await previous.updated;
    const widthBefore = panelWidth(doc);
    let result;
    try {
    result = await update();
    } catch (error) {
    failure = { error };
    call.transition?.skipTransition?.();
    return;
    }
    if (latest()) liftIndicatorNames(doc);
    if (latest()) moveViewFocus(doc, before, result, focus);
    const widthAfter = latest() && widthBefore !== null ? panelWidth(doc) : null;
    if (widthAfter !== null && Math.abs(widthAfter - widthBefore) > 0.5) root.setAttribute('data-ds-vt-morph', '');
    if (type === 'container' && latest()) {
    if (container && isElement(result) && result.isConnected && !clippedOnScreen(result)) nameContainer(call, result);
    else root.setAttribute('data-ds-vt', 'fade-through');
    }
    } finally {
    clearTimeout(watchdog);
    settleUpdate();
    }
    };
    let started;
    try {
    started = doc.startViewTransition(run);
    } catch (error) {
    unnameAll(call);
    if (latest()) {
    root.removeAttribute('data-ds-vt');
    root.removeAttribute('data-ds-vt-morph');
    viewCalls.delete(doc);
    restoreLiftedNames(doc);
    }
    return swapView(doc, update, focus);
    }
    call.transition = started;
    call.updated.then(() => resyncScroll(doc));
    started.ready?.catch?.(() => {});
    const unforward = forwardPresses(doc, call);
    const ended = Promise.allSettled([started.updateCallbackDone, started.finished]).then(([updated]) => {
    clearTimeout(watchdog);
    unforward();
    unnameAll(call);
    if (latest()) {
    root.removeAttribute('data-ds-vt');
    root.removeAttribute('data-ds-vt-morph');
    viewCalls.delete(doc);
    restoreLiftedNames(doc);
    }
    return updated;
    });
    call.done = ended.then(() => {});
    return ended.then((updated) => {
    if (failure) throw failure.error;
    if (updated.status === 'rejected') throw updated.reason;
    });
    }
    function transition(update, options = {}) {
    const type = options?.type ?? 'fade-through';
    const from = options?.from ?? null;
    if (!VIEW_TYPES.includes(type)) throw new TypeError(`DS.motion.transition: unknown type "${type}" (${VIEW_TYPES.join(', ')})`);
    if (typeof update !== 'function') throw new TypeError('DS.motion.transition: update must be a function');
    const doc = from?.ownerDocument ?? globalThis.document;
    const root = doc?.documentElement;
    const focus = options?.focus ?? false;
    if (doc && typeof doc.startViewTransition === 'function' && root?.classList?.contains('ds-theme')) return viewTransition(doc, update, type, from, focus);
    return swapView(doc, update, focus);
    }

    return Object.freeze({
      MOTION_FALLBACKS: MOTION_FALLBACKS,
      LOADER_DELAY_MS: LOADER_DELAY_MS,
      LOADER_MIN_VISIBLE_MS: LOADER_MIN_VISIBLE_MS,
      STAGGER_MAX: STAGGER_MAX,
      motionDuration: motionDuration,
      motionEasing: motionEasing,
      travelDuration: travelDuration,
      resyncScroll: resyncScroll,
      stagger: stagger,
      replay: replay,
      settled: settled,
      enter: enter,
      leave: leave,
      cancel: cancel,
      enterAll: enterAll,
      staggerOnce: staggerOnce,
      loaderHoldMs: loaderHoldMs,
      settleLoader: settleLoader,
      refresh: refresh,
      guard: guard,
      setLabel: setLabel,
      busy: busy,
      COUNT_UP_MS: COUNT_UP_MS,
      countUp: countUp,
      originFrom: originFrom,
      roll: roll,
      crossfade: crossfade,
      flip: flip,
      sortable: sortable,
      transition: transition
    });
  });

  add('indicator', ['OVERSHOOT', 'create'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, emit = DS.core.emit;
    const motionDuration = DS.motion.motionDuration, travelDuration = DS.motion.travelDuration;
    const OVERSHOOT = 0.05;
    const EDGES = ['--ds-indicator-t', '--ds-indicator-r', '--ds-indicator-b', '--ds-indicator-l'];
    const ACTIVE_ATTRIBUTES = ['aria-current', 'aria-pressed', 'aria-selected', 'aria-checked'];
    const INSTANT = 'ds-indicator--instant';
    const MODAL_OPEN = [
    '.ds-dialog[data-state="open"]:not(.ds-dialog--contained)',
    '.ds-sheet[data-state="open"]',
    'dialog.ds-dialog[open]:not(.ds-dialog--contained)',
    'dialog.ds-sheet[open]',
    '.ds-dialog:not(dialog, [hidden], [data-state], .ds-dialog--contained, .ds-dialog--hidden, .ds-dialog--closing)',
    '.ds-sheet[aria-modal="true"]:not(dialog, [hidden], [data-state], .ds-sheet--closing)',
    ].join(', ');
    const live = new WeakMap();
    const fontWatchers = new WeakMap();
    const pageWatchers = new WeakMap();
    function notify(set, method, event) {
    for (const ref of set) {
    const watcher = ref.deref();
    if (!watcher || watcher.gone()) set.delete(ref);
    else watcher[method](event);
    }
    }
    function watch(registry, owner, watcher, listen) {
    let entry = registry.get(owner);
    if (!entry) {
    const set = new Set();
    entry = { set, stop: listen(set) };
    registry.set(owner, entry);
    }
    const ref = new WeakRef(watcher);
    entry.set.add(ref);
    return () => {
    entry.set.delete(ref);
    if (entry.set.size || registry.get(owner) !== entry) return;
    registry.delete(owner);
    entry.stop();
    };
    }
    const same = (a, b) => Boolean(a && b) && ['left', 'top', 'right', 'bottom'].every((side) => Math.abs(a[side] - b[side]) < 0.5);
    const px = (value) => `${value}px`;
    const kept = (node) => node?.nodeType === 1 && node.hasAttribute?.('data-ds-keep');
    function rendered(item) {
    if (item.closest?.('details:not([open]) > :not(summary)')) return false;
    return typeof item.getClientRects !== 'function' || item.getClientRects().length > 0;
    }
    function optionsKey({ active, className = '', observe = true, name = '', reveal = false }) {
    return JSON.stringify([active, className, Boolean(observe), name, Boolean(reveal)]);
    }
    function activeState(current, selector, item) {
    const named = ACTIVE_ATTRIBUTES.filter((name) => selector.includes(`[${name}`));
    const says = (name) => {
    const value = current?.getAttribute(name);
    return value && value !== 'false' ? value : null;
    };
    const own = named.find(says);
    if (own) return { name: own, value: says(own) };
    const name = named.find((other) => item?.hasAttribute(other)) ?? named[0];
    if (!name) return null;
    const value = selector.match(new RegExp(`\\[${name}=["']?([^"'\\]]+)`))?.[1];
    return { name, value: value && value !== 'false' ? value : 'true' };
    }
    function makePill(track, options) {
    const { active, className = '', observe = true, name = '', reveal = false } = options;
    const doc = track.ownerDocument ?? document;
    const view = doc.defaultView ?? globalThis;
    const indicator = doc.createElement('span');
    indicator.className = `ds-indicator ${INSTANT}${className ? ` ${className}` : ''}`;
    indicator.setAttribute('aria-hidden', 'true');
    indicator.setAttribute('data-ds-keep', '');
    if (name) indicator.style.setProperty('view-transition-name', `ds-indicator-${name}`);
    track.prepend(indicator);
    const settling = !track.hasAttribute('data-ds-moving');
    if (settling) track.setAttribute('data-ds-moving', '');
    track.classList.add('ds-has-indicator');
    if (settling) {
    if (typeof view.getComputedStyle === 'function') void view.getComputedStyle(track).opacity;
    track.removeAttribute('data-ds-moving');
    }
    let announced;
    let placed = (null);
    let target = (null);
    let box = target;
    let jump = true;
    let generation = 0;
    let destroyed = false;
    let frame = 0;
    let adopted = false;
    const computed = () => (typeof view.getComputedStyle === 'function' ? view.getComputedStyle(indicator) : null);
    const flush = () => computed()?.getPropertyValue(EDGES[0]);
    function edgeTransitions() {
    if (typeof indicator.getAnimations !== 'function') return [];
    return indicator.getAnimations().filter((animation) => EDGES.includes(animation.transitionProperty));
    }
    function measure(item, trackRect) {
    const rect = item.getBoundingClientRect();
    const left = rect.left - trackRect.left - track.clientLeft + track.scrollLeft;
    const top = rect.top - trackRect.top - track.clientTop + track.scrollTop;
    return { left, top, right: left + rect.width, bottom: top + rect.height };
    }
    function painted() {
    const style = computed();
    if (!box || !style) return target;
    const edge = (index) => parseFloat(style.getPropertyValue(EDGES[index])) || 0;
    return { left: box.left + edge(3), top: box.top + edge(0), right: box.right - edge(1), bottom: box.bottom - edge(2) };
    }
    function write(nextBox, rect) {
    box = nextBox;
    const style = indicator.style;
    style.setProperty('--ds-indicator-x', px(nextBox.left));
    style.setProperty('--ds-indicator-y', px(nextBox.top));
    style.setProperty('--ds-indicator-w', px(nextBox.right - nextBox.left));
    style.setProperty('--ds-indicator-h', px(nextBox.bottom - nextBox.top));
    insets(rect);
    }
    function insets(rect) {
    const style = indicator.style;
    style.setProperty(EDGES[0], px(rect.top - box.top));
    style.setProperty(EDGES[1], px(box.right - rect.right));
    style.setProperty(EDGES[2], px(box.bottom - rect.bottom));
    style.setProperty(EDGES[3], px(rect.left - box.left));
    }
    function prepare(nextBox, from) {
    indicator.classList.add(INSTANT);
    delete indicator.dataset.dir;
    indicator.dataset.glide = '';
    indicator.style.setProperty('border-radius', '0px');
    write(nextBox, from);
    flush();
    }
    function release(gen, done) {
    indicator.classList.remove(INSTANT);
    const running = edgeTransitions();
    if (!running.length) {
    done();
    return;
    }
    Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
    if (!destroyed && gen === generation) done();
    });
    }
    function glideBox(from, to) {
    const margin = (travel) => (travel > 0 ? Math.ceil(OVERSHOOT * travel) + 1 : 0);
    const union = {
    left: Math.min(from.left, to.left) - margin(from.left - to.left),
    top: Math.min(from.top, to.top) - margin(from.top - to.top),
    right: Math.max(from.right, to.right) + margin(to.right - from.right),
    bottom: Math.max(from.bottom, to.bottom) + margin(to.bottom - from.bottom),
    };
    const style = typeof view.getComputedStyle === 'function' ? view.getComputedStyle(track) : null;
    if (style && style.overflowX !== 'visible') {
    union.left = Math.max(union.left, Math.min(from.left, to.left, 0));
    union.right = Math.min(union.right, Math.max(from.right, to.right, track.scrollWidth));
    }
    if (style && style.overflowY !== 'visible') {
    union.top = Math.max(union.top, Math.min(from.top, to.top, 0));
    union.bottom = Math.min(union.bottom, Math.max(from.bottom, to.bottom, track.scrollHeight));
    }
    return union;
    }
    function adoptRadius(rect) {
    const style = computed();
    if (!style || (!adopted && style.getPropertyValue('--ds-indicator-radius').trim() !== '0px')) return;
    const own = String(style.borderTopLeftRadius || '').trim().split(/\s+/)[0];
    const side = Math.min(rect.right - rect.left, rect.bottom - rect.top);
    const value = parseFloat(own);
    const radius = Math.min(own.endsWith('%') ? value * side * 0.01 : value, side / 2);
    if (!(radius > 0)) {
    if (adopted) indicator.style.removeProperty('--ds-indicator-radius');
    adopted = false;
    return;
    }
    const copy = `calc(${px(radius)} * var(--ds-shape, 1))`;
    adopted = true;
    if (indicator.style.getPropertyValue('--ds-indicator-radius') === copy) return;
    indicator.style.setProperty('transition', 'none');
    indicator.style.setProperty('--ds-indicator-radius', copy);
    flush();
    indicator.style.removeProperty('transition');
    }
    function still() {
    indicator.classList.add(INSTANT);
    delete indicator.dataset.glide;
    delete indicator.dataset.dir;
    indicator.style.removeProperty('border-radius');
    }
    function rest(item, rect) {
    generation += 1;
    still();
    delete indicator.dataset.empty;
    write(rect, rect);
    target = rect;
    jump = false;
    adoptRadius(rect);
    setPlaced(item);
    }
    function setPlaced(item) {
    if (placed === item) return;
    placed = item;
    schedule();
    }
    function labelTime() {
    const own = parseFloat(track.style.getPropertyValue('--ds-indicator-dur'));
    return Number.isFinite(own) ? own : motionDuration(track, '--ds-dur-medium');
    }
    function setTime(duration) {
    const previous = labelTime();
    track.style.setProperty('--ds-indicator-dur', `${duration}ms`);
    if (typeof track.getAnimations !== 'function' || Math.abs(previous - duration) < 0.5) return;
    const fresh = motionDuration(track, '--ds-dur-micro');
    for (const animation of track.getAnimations({ subtree: true })) {
    if (animation.transitionProperty !== 'color' || animation.effect?.target === indicator) continue;
    if (Math.abs(Number(animation.effect.getTiming().duration) - previous) >= 0.5) continue;
    if (Number(animation.currentTime ?? 0) > fresh) continue;
    animation.effect.updateTiming({ duration });
    }
    }
    function glide(item, from, to) {
    const gen = ++generation;
    const dx = (to.left + to.right - from.left - from.right) / 2;
    const dy = (to.top + to.bottom - from.top - from.bottom) / 2;
    const distance = Math.hypot(dx, dy);
    setTime(travelDuration(track, distance));
    prepare(glideBox(from, to), from);
    if (distance >= 0.5) {
    indicator.dataset.dir = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
    insets(to);
    target = to;
    setPlaced(item);
    release(gen, () => rest(item, to));
    }
    function appear(item, to) {
    if (edgeTransitions().length) {
    const from = painted();
    delete indicator.dataset.empty;
    glide(item, from, to);
    return;
    }
    const gen = ++generation;
    setTime(motionDuration(track, '--ds-dur-medium'));
    indicator.dataset.empty = '';
    const half = (to.right - to.left) / 2;
    prepare(to, { left: to.left + half, top: to.top, right: to.right - half, bottom: to.bottom });
    delete indicator.dataset.empty;
    insets(to);
    target = to;
    setPlaced(item);
    release(gen, () => rest(item, to));
    }
    function disappear() {
    const gen = ++generation;
    const from = edgeTransitions().length ? painted() : target;
    placed = null;
    target = null;
    if (!from || jump) {
    still();
    indicator.dataset.empty = '';
    jump = false;
    return;
    }
    prepare(box, from);
    indicator.dataset.empty = '';
    const half = (from.right - from.left) / 2;
    insets({ left: from.left + half, top: from.top, right: from.right - half, bottom: from.bottom });
    release(gen, still);
    }
    function room() {
    const style = typeof view.getComputedStyle === 'function' ? view.getComputedStyle(track) : null;
    const px = (name) => (style ? parseFloat(style.getPropertyValue(name)) : NaN);
    const space = px('--ds-space-2');
    const base = Number.isFinite(space) ? space : 8;
    const side = (name) => Math.max(base, px(name) || 0);
    return { top: side('scroll-padding-top'), bottom: side('scroll-padding-bottom'), left: side('scroll-padding-left'), right: side('scroll-padding-right') };
    }
    function revealRect(rect, instant) {
    const margin = room();
    const axis = (start, end, scroll, size, range, before, after) => {
    if (range <= size + 1) return scroll;
    if (start - before < scroll || end - start + before + after > size) return Math.max(0, start - before);
    if (end + after > scroll + size) return end + after - size;
    return scroll;
    };
    const top = axis(rect.top, rect.bottom, track.scrollTop, track.clientHeight, track.scrollHeight, margin.top, margin.bottom);
    const left = axis(rect.left, rect.right, track.scrollLeft, track.clientWidth, track.scrollWidth, margin.left, margin.right);
    if (Math.abs(top - track.scrollTop) < 0.5 && Math.abs(left - track.scrollLeft) < 0.5) return;
    if (typeof track.scrollTo === 'function') track.scrollTo({ top, left, behavior: instant ? 'auto' : 'smooth' });
    }
    function place() {
    if (destroyed) return;
    if (track.isConnected === false) return;
    if (indicator.parentNode !== track) {
    track.prepend(indicator);
    jump = true;
    }
    const trackRect = track.getBoundingClientRect();
    if (trackRect.width === 0) {
    generation += 1;
    still();
    indicator.dataset.empty = '';
    placed = null;
    target = null;
    jump = true;
    return;
    }
    if (reveal && track.classList.contains('ds-drawer__list')) {
    track.classList.toggle('ds-drawer__list--overflow', track.scrollHeight > track.clientHeight + 1);
    }
    const found = track.querySelector(active);
    move(found && rendered(found) ? found : null, trackRect);
    if (found === announced) return;
    const first = announced === undefined;
    announced = found;
    if (!first) emit(track, 'change', { item: found });
    }
    function move(item, trackRect) {
    if (!item) {
    if (placed !== null || jump) disappear();
    return;
    }
    const to = measure(item, trackRect);
    if (reveal) revealRect(to, jump);
    if (jump) {
    rest(item, to);
    return;
    }
    if (placed === null) {
    appear(item, to);
    return;
    }
    const running = edgeTransitions().length > 0;
    if (running && same(to, target)) return;
    if (running || item !== placed) {
    glide(item, running ? painted() : target, to);
    return;
    }
    if (!same(to, target)) rest(item, to);
    }
    let observed = new Set();
    const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(() => place()) : null;
    function syncObserved() {
    if (!resize) return;
    const wanted = new Set([track]);
    for (const child of track.children ?? []) if (child !== indicator) wanted.add(child);
    if (placed) wanted.add(placed);
    for (const element of observed) if (!wanted.has(element)) resize.unobserve(element);
    for (const element of wanted) if (!observed.has(element)) resize.observe(element);
    observed = wanted;
    }
    function relevant(record) {
    if (record.target === indicator) return false;
    const keep = record.target?.closest?.('[data-ds-keep]');
    if (keep && keep !== track && track.contains(keep)) return false;
    if (record.type !== 'childList') return true;
    return ![...record.addedNodes, ...record.removedNodes].every(kept);
    }
    const mutations = observe && typeof view.MutationObserver === 'function'
    ? new view.MutationObserver((records) => {
    if (records.some(relevant)) schedule();
    })
    : null;
    mutations?.observe(track, { subtree: true, childList: true, attributes: true, attributeFilter: ACTIVE_ATTRIBUTES });
    function schedule() {
    if (destroyed || frame || typeof view.requestAnimationFrame !== 'function') return;
    frame = view.requestAnimationFrame(() => {
    frame = 0;
    if (destroyed) return;
    syncObserved();
    place();
    });
    }
    function shownWhole() {
    const rect = indicator.getBoundingClientRect();
    let clip = { left: 0, top: 0, right: view.innerWidth ?? Infinity, bottom: view.innerHeight ?? Infinity };
    for (let el = indicator.parentElement; el && el !== doc.body && el !== doc.documentElement; el = el.parentElement) {
    const cs = view.getComputedStyle(el);
    if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
    const outer = el.getBoundingClientRect();
    const left = outer.left + el.clientLeft;
    const top = outer.top + el.clientTop;
    clip = { left: Math.max(clip.left, left), top: Math.max(clip.top, top), right: Math.min(clip.right, left + el.clientWidth), bottom: Math.min(clip.bottom, top + el.clientHeight) };
    }
    return rect.left >= clip.left - 0.5 && rect.top >= clip.top - 0.5 && rect.right <= clip.right + 0.5 && rect.bottom <= clip.bottom + 0.5;
    }
    const ownName = name ? `ds-indicator-${name}` : '';
    const rename = () => {
    if (!destroyed) indicator.style.setProperty('view-transition-name', ownName);
    };
    const covered = () => Boolean(doc.querySelector?.(`${MODAL_OPEN}, .ds-app[data-drawer-open]`));
    const onPageTransition = (event) => {
    if (destroyed || !event.viewTransition || typeof view.getComputedStyle !== 'function') return;
    if (!covered() && shownWhole()) return;
    indicator.style.setProperty('view-transition-name', 'none');
    event.viewTransition.finished?.then(rename, rename);
    };
    const onPageShow = (event) => {
    if (event.persisted) rename();
    };
    const watcher = {
    fonts: () => schedule(),
    page: onPageTransition,
    shown: onPageShow,
    gone: () => destroyed,
    };
    const unwatch = [];
    const fonts = doc.fonts;
    if (fonts) {
    unwatch.push(watch(fontWatchers, fonts, watcher, (set) => {
    const onFonts = () => notify(set, 'fonts');
    fonts.addEventListener?.('loadingdone', onFonts);
    return () => fonts.removeEventListener?.('loadingdone', onFonts);
    }));
    fonts.ready?.then(() => watcher.fonts()).catch(() => {});
    }
    if (name) {
    unwatch.push(watch(pageWatchers, view, watcher, (set) => {
    const onTransition = (event) => notify(set, 'page', event);
    const onShow = (event) => notify(set, 'shown', event);
    view.addEventListener?.('pageswap', onTransition);
    view.addEventListener?.('pagereveal', onTransition);
    view.addEventListener?.('pageshow', onShow);
    return () => {
    view.removeEventListener?.('pageswap', onTransition);
    view.removeEventListener?.('pagereveal', onTransition);
    view.removeEventListener?.('pageshow', onShow);
    };
    }));
    }
    place();
    syncObserved();
    return {
    watcher,
    place,
    get: () => track.querySelector(active),
    set(value) {
    const item = typeof value === 'string' ? track.querySelector(value) : value ?? null;
    if (value !== null && (!item || !track.contains(item))) return;
    const current = [...track.querySelectorAll(active)];
    if (item ? current.length === 1 && current[0] === item : !current.length) return;
    const state = activeState(current[0], active, item);
    if (!state) return;
    for (const other of current) {
    if (state.name === 'aria-current') other.removeAttribute(state.name);
    else other.setAttribute(state.name, 'false');
    }
    item?.setAttribute(state.name, state.value);
    place();
    },
    destroy() {
    if (destroyed) return;
    destroyed = true;
    generation += 1;
    resize?.disconnect();
    mutations?.disconnect();
    if (frame) view.cancelAnimationFrame?.(frame);
    frame = 0;
    for (const stop of unwatch) stop();
    indicator.remove();
    track.classList.remove('ds-has-indicator');
    track.style.removeProperty('--ds-indicator-dur');
    },
    };
    }
    function replacePill(entry, track, options, key) {
    entry.pill.destroy();
    entry.pill = makePill(track, options);
    entry.key = key;
    }
    function openPill(track, options, read) {
    const key = optionsKey(options);
    const existing = live.get(track);
    if (existing) {
    if (read) existing.read = read;
    if (existing.key === key) return existing.handle;
    if (existing.read) {
    replacePill(existing, track, options, key);
    return existing.handle;
    }
    existing.handle.destroy();
    }
    const entry = { key, read, pill: makePill(track, options), stops: new Set(), gone: false, handle: null };
    entry.handle = {
    get: () => entry.pill.get(),
    set(value) {
    entry.pill.set(value);
    },
    on(type, fn) {
    if (entry.gone) return () => {};
    const name = String(type).startsWith('ds:') ? String(type) : `ds:${type}`;
    const listener = (event) => {
    if (event.target === track) fn(event);
    };
    const stop = () => {
    track.removeEventListener(name, listener);
    entry.stops.delete(stop);
    };
    track.addEventListener(name, listener);
    entry.stops.add(stop);
    return stop;
    },
    update(names) {
    if (entry.gone) return;
    if (names?.length && entry.read) {
    const next = entry.read();
    const nextKey = optionsKey(next);
    if (nextKey !== entry.key) replacePill(entry, track, next, nextKey);
    return;
    }
    entry.pill.place();
    },
    destroy() {
    if (entry.gone) return;
    entry.gone = true;
    entry.pill.destroy();
    for (const stop of [...entry.stops]) stop();
    if (live.get(track) === entry) live.delete(track);
    },
    };
    live.set(track, entry);
    return entry.handle;
    }
    function create(track, options) {
    return openPill(track, options, null);
    }
    const ANY_ACTIVE = '[aria-current]:not([aria-current="false"]), [aria-pressed="true"], [aria-selected="true"], [aria-checked="true"]';
    define('indicator', {
    attribute: 'data-ds-indicator',
    attributes: ['data-ds-indicator-class', 'data-ds-indicator-name', 'data-ds-indicator-reveal'],
    init(el) {
    const read = () => ({
    active: el.getAttribute('data-ds-indicator') || ANY_ACTIVE,
    className: el.getAttribute('data-ds-indicator-class') ?? '',
    name: el.getAttribute('data-ds-indicator-name') ?? '',
    reveal: el.hasAttribute('data-ds-indicator-reveal'),
    });
    return openPill(el, read(), read);
    },
    });

    return Object.freeze({
      OVERSHOOT: OVERSHOOT,
      create: create
    });
  });

  add('dom', ['morphChildren', 'morphHtml', 'own', 'disown', 'watchScrolled', 'scrollEdges', 'progress', 'roving', 'typesText', 'followViewport', 'followEnd', 'autosize', 'dropzone'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const resyncScroll = DS.motion.resyncScroll;
    const LOOKAHEAD = 8;
    const RUNTIME_CLASS = /^ds-(?:enter|leave)(?:--[\w-]+)?$|^ds-(?:has-indicator|pressed|ripples)$/;
    const RUNTIME_STYLE = /^--ds-(?:i|indicator-[\w-]+|ripple-[xyr]|motion-origin|clip-from)$/;
    const RUNTIME_ATTRIBUTES = new Set(['data-ds-staggered', 'data-ds-moving']);
    const OWNED = Symbol.for('ds.owned');
    const owned = (element, kind, name) => Boolean(element[OWNED]?.[kind]?.get(name));
    const exiting = (element) => Array.from(element.classList ?? []).some((name) => /^ds-leave(?:--[\w-]+)?$/.test(name));
    function activeIn(node) {
    const root = node?.getRootNode?.();
    return (root?.nodeType === 11 ? root.activeElement : null) ?? node?.ownerDocument?.activeElement ?? null;
    }
    const isElement = (node) => node?.nodeType === 1;
    function declarations(text) {
    const out = new Map();
    for (const part of String(text ?? '').split(';')) {
    const colon = part.indexOf(':');
    if (colon < 0) continue;
    const name = part.slice(0, colon).trim();
    if (name) out.set(name.startsWith('--') ? name : name.toLowerCase(), part.slice(colon + 1).trim().replace(/\s+/g, ' '));
    }
    return out;
    }
    function equivalentShell(a, b) {
    if (!isElement(a) || !isElement(b) || a.tagName !== b.tagName) return false;
    const classes = (element, other) => new Set((element.getAttribute('class') ?? '').split(/\s+/)
    .filter((name) => name && !RUNTIME_CLASS.test(name) && !owned(other, 'classes', name)));
    const ca = classes(a, a);
    const cb = classes(b, a);
    if (ca.size !== cb.size || [...ca].some((name) => !cb.has(name))) return false;
    const styles = (element) => new Map([...declarations(element.getAttribute('style'))]
    .filter(([name]) => !RUNTIME_STYLE.test(name) && !owned(a, 'props', name)));
    const sa = styles(a);
    const sb = styles(b);
    if (sa.size !== sb.size || [...sa].some(([name, value]) => sb.get(name) !== value)) return false;
    const others = (element) => Array.from(element.attributes).filter(({ name }) => name !== 'class' && name !== 'style'
    && !RUNTIME_ATTRIBUTES.has(name) && !owned(a, 'attrs', name) && !(name === 'inert' && exiting(a)));
    const oa = others(a);
    const ob = others(b);
    return oa.length === ob.length && oa.every(({ name, value }) => b.getAttribute(name) === value);
    }
    function sameShell(a, b) {
    if (!isElement(a) || !isElement(b)) return false;
    const x = (a);
    const y = (b);
    if (x.tagName !== y.tagName || x.attributes.length !== y.attributes.length) return false;
    for (const attribute of Array.from(x.attributes)) {
    if (y.getAttribute(attribute.name) !== attribute.value) return false;
    }
    return true;
    }
    function keyOf(node) {
    if (!isElement(node)) return null;
    return node.getAttribute('data-ds-key') || node.getAttribute('id') || null;
    }
    const kept = (node) => isElement(node) && node.hasAttribute('data-ds-keep');
    const leaving = (node) => isElement(node) && node.hasAttribute('data-ds-leaving');
    const skipped = (node) => kept(node) || leaving(node);
    const blank = (node) => node.nodeType === 3 && !/\S/.test(node.nodeValue ?? '');
    const replacing = (node) => isElement(node) && node.hasAttribute('data-ds-replace');
    function live(node) {
    let current = node;
    while (current && skipped(current)) current = current.nextSibling;
    return current;
    }
    function holdsFocus(node, ctx) {
    return Boolean(ctx.active && isElement(node) && (node === ctx.active || node.contains(ctx.active)));
    }
    function sameKind(a, b) {
    if (a.nodeType !== b.nodeType) return false;
    return !isElement(a) || a.tagName === b.tagName;
    }
    function removeNode(node, ctx) {
    if (kept(node)) return;
    if (!isElement(node) || typeof ctx.options.onRemove !== 'function') {
    node.remove();
    return;
    }
    const result = ctx.options.onRemove( (node));
    if (!result || typeof ( (result).then) !== 'function') {
    node.remove();
    return;
    }
    const element = (node);
    element.setAttribute('data-ds-leaving', '');
    element.setAttribute('aria-hidden', 'true');
    element.inert = true;
    const done = () => element.remove();
    (result).then(done, done);
    }
    function insertNode(parent, node, before, ctx) {
    parent.insertBefore(node, before);
    if (isElement(node)) ctx.options.onInsert?.(node);
    }
    function moveNode(parent, node, before, ctx) {
    if (typeof parent.moveBefore === 'function') {
    try {
    parent.moveBefore(node, before);
    return;
    } catch {
    }
    }
    const focused = holdsFocus(node, ctx) ? (ctx.active) : null;
    let selection = null;
    try {
    if (focused && typeof focused.selectionStart === 'number') selection = [focused.selectionStart, focused.selectionEnd, focused.selectionDirection];
    } catch {
    }
    if (!node.hasAttribute('data-ds-moving')) {
    node.setAttribute('data-ds-moving', '');
    ctx.moved.push(node);
    }
    parent.insertBefore(node, before);
    const doc = parent.ownerDocument;
    if (focused && doc && activeIn(focused) !== focused && typeof focused.focus === 'function') {
    focused.focus({ preventScroll: true });
    if (selection) focused.setSelectionRange?.(selection[0], selection[1], selection[2] ?? undefined);
    }
    }
    function syncClass(old, next) {
    const current = Array.from(old.classList);
    const wanted = (next.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
    .filter((name) => current.includes(name) || !owned(old, 'classes', name));
    const runtime = current.filter((name) => (RUNTIME_CLASS.test(name) || owned(old, 'classes', name)) && !wanted.includes(name));
    const result = [...wanted, ...runtime];
    if (result.length === current.length && result.every((name) => current.includes(name))) return;
    if (result.length) old.setAttribute('class', result.join(' '));
    else old.removeAttribute('class');
    }
    function syncStyle(old, next) {
    const wanted = next.getAttribute('style');
    if (old.getAttribute('style') === wanted) return;
    const style = old.style;
    if (!style || typeof style.setProperty !== 'function') {
    if (wanted === null) old.removeAttribute('style');
    else old.setAttribute('style', wanted);
    return;
    }
    const runtime = [];
    const props = old[OWNED]?.props;
    const absent = [];
    for (let index = 0; index < style.length; index += 1) {
    const name = style[index];
    if (RUNTIME_STYLE.test(name) || owned(old, 'props', name)) runtime.push([name, style.getPropertyValue(name), style.getPropertyPriority(name)]);
    }
    for (const [name, count] of props ?? []) if (count && !style.getPropertyValue(name)) absent.push(name);
    style.cssText = wanted ?? '';
    for (const name of absent) style.removeProperty(name);
    for (const [name, value, priority] of runtime) style.setProperty(name, value, priority);
    if (!old.style.length) old.removeAttribute('style');
    }
    function isRadio(node) {
    return node?.tagName === 'INPUT' && node.type === 'radio';
    }
    function sameGroup(a, b) {
    return Boolean(a.name) && a.name === b.name && a.form === b.form && a.getRootNode() === b.getRootNode();
    }
    function inFocusedControl(element, active) {
    if (!active) return false;
    if (element === active) return true;
    if (element.tagName === 'OPTION') return element.closest('select') === active;
    return isRadio(element) && isRadio(active) && sameGroup(element, active);
    }
    function keepChoice(active) {
    if (active?.tagName === 'SELECT') {
    const select = (active);
    const before = new Map(Array.from(select.options, (option) => [option, option.selected]));
    return () => {
    const options = Array.from(select.options).filter((option) => before.has(option));
    if (select.multiple) for (const option of options) if (!before.get(option) && option.selected) option.selected = false;
    for (const option of options) if (before.get(option) && !option.selected) option.selected = true;
    };
    }
    if (isRadio(active) && (active).name) {
    const group = () => Array.from(active.getRootNode().querySelectorAll('input[type="radio"]')).filter((radio) => sameGroup(radio, active));
    const checked = group().find((radio) => radio.checked) ?? null;
    return () => {
    if (checked?.isConnected) {
    if (!checked.checked) checked.checked = true;
    } else if (!checked) {
    for (const radio of group()) if (radio.checked) radio.checked = false;
    }
    };
    }
    return null;
    }
    function syncProperty(element, name, present, ctx) {
    if (inFocusedControl(element, ctx.active)) return;
    const tag = element.tagName;
    if (tag === 'INPUT' && name === 'value') element.value = element.getAttribute('value') ?? '';
    else if (tag === 'INPUT' && name === 'checked') element.checked = present;
    else if (tag === 'OPTION' && name === 'selected') element.selected = present;
    }
    function syncAttributes(old, next, ctx) {
    for (const attribute of Array.from(old.attributes)) {
    const name = attribute.name;
    if (name === 'class' || name === 'style' || RUNTIME_ATTRIBUTES.has(name) || owned(old, 'attrs', name)) continue;
    if (name === 'inert' && exiting(old)) continue;
    if (attribute.namespaceURI ? next.hasAttributeNS(attribute.namespaceURI, attribute.localName) : next.hasAttribute(name)) continue;
    if (attribute.namespaceURI) old.removeAttributeNS(attribute.namespaceURI, attribute.localName);
    else old.removeAttribute(name);
    syncProperty(old, name, false, ctx);
    }
    for (const attribute of Array.from(next.attributes)) {
    const name = attribute.name;
    if (name === 'class' || name === 'style' || owned(old, 'attrs', name)) continue;
    if (attribute.namespaceURI) {
    if (old.getAttributeNS(attribute.namespaceURI, attribute.localName) === attribute.value) continue;
    old.setAttributeNS(attribute.namespaceURI, name, attribute.value);
    } else {
    if (old.getAttribute(name) === attribute.value) continue;
    old.setAttribute(name, attribute.value);
    }
    syncProperty(old, name, true, ctx);
    }
    syncClass(old, next);
    syncStyle(old, next);
    }
    function patchNode(old, next, ctx) {
    if (!isElement(old)) {
    if (old.nodeValue !== next.nodeValue) old.nodeValue = next.nodeValue;
    return;
    }
    if (!sameShell(old, next)) syncAttributes(old, next, ctx);
    const inner = { ...ctx, replace: ctx.replace || replacing(old) || replacing(next) };
    const before = old.tagName === 'TEXTAREA' ? old.textContent : null;
    patchChildren(old, Array.from(next.childNodes), inner, false);
    if (before !== null && old !== ctx.active && old.textContent !== before) old.value = old.textContent;
    ctx.options.onKeep?.(old, next);
    }
    function patchable(old, next, ctx) {
    if (!sameKind(old, next)) return false;
    if (holdsFocus(old, ctx)) return true;
    return !(ctx.replace || replacing(old) || replacing(next));
    }
    const shellOf = (old, next) => sameShell(old, next) || equivalentShell(old, next);
    function lookAhead(cursor, node, ctx) {
    let candidate = cursor.nextSibling;
    let checked = 0;
    if (holdsFocus(cursor, ctx)) return null;
    while (candidate && checked < LOOKAHEAD) {
    if (!skipped(candidate) && !blank(candidate) && keyOf(candidate) === null) {
    checked += 1;
    if (sameKind(candidate, node) && candidate.isEqualNode(node)) return candidate;
    if (holdsFocus(candidate, ctx)) return null;
    }
    candidate = candidate.nextSibling;
    }
    return null;
    }
    function patchInPlace(parent, desired, ctx) {
    const keyed = new Map();
    const unkeyed = [];
    for (const child of Array.from(parent.childNodes)) {
    if (skipped(child)) continue;
    const key = keyOf(child);
    if (key === null) unkeyed.push(child);
    else if (!keyed.has(key)) keyed.set(key, child);
    }
    let index = 0;
    for (const node of desired) {
    const key = keyOf(node);
    if (key !== null) {
    const old = keyed.get(key);
    if (old && old.tagName === node.tagName) {
    keyed.delete(key);
    patchNode(old, node, ctx);
    }
    continue;
    }
    const limit = Math.min(unkeyed.length, index + LOOKAHEAD + 1);
    for (let at = index; at < limit; at += 1) {
    if (!sameKind(unkeyed[at], node)) continue;
    if (!unkeyed[at].isEqualNode(node)) patchNode(unkeyed[at], node, ctx);
    index = at + 1;
    break;
    }
    }
    }
    function patchChildren(parent, desired, ctx, top) {
    if (top && ctx.options.holdOrder) {
    patchInPlace(parent, desired, ctx);
    return;
    }
    const keyed = new Map();
    for (const child of Array.from(parent.childNodes)) {
    const key = skipped(child) ? null : keyOf(child);
    if (key !== null && !keyed.has(key)) keyed.set(key, child);
    }
    const used = new Set();
    let cursor = live(parent.firstChild);
    const step = () => {
    cursor = live(cursor.nextSibling);
    };
    for (const node of desired) {
    const key = keyOf(node);
    if (key !== null) {
    const old = keyed.get(key);
    if (old && !used.has(old) && sameKind(old, node) && (shellOf(old, node) || patchable(old, node, ctx))) {
    used.add(old);
    if (old === cursor) step();
    else moveNode(parent, old, cursor, ctx);
    patchNode(old, node, ctx);
    } else {
    insertNode(parent, node, cursor, ctx);
    }
    continue;
    }
    if (!cursor) {
    insertNode(parent, node, null, ctx);
    continue;
    }
    const cursorKeyed = keyOf(cursor) !== null;
    if (!cursorKeyed && sameKind(cursor, node) && cursor.isEqualNode(node)) {
    step();
    continue;
    }
    if (!cursorKeyed && shellOf(cursor, node)) {
    const current = cursor;
    step();
    patchNode(current, node, ctx);
    continue;
    }
    const match = cursorKeyed ? null : lookAhead(cursor, node, ctx);
    if (match) {
    let stale = cursor;
    while (stale && stale !== match) {
    const next = stale.nextSibling;
    if (!skipped(stale) && keyOf(stale) === null) removeNode(stale, ctx);
    stale = next;
    }
    cursor = live(match.nextSibling);
    continue;
    }
    if (!cursorKeyed && sameKind(cursor, node)) {
    const current = cursor;
    step();
    if (patchable(current, node, ctx)) patchNode(current, node, ctx);
    else {
    insertNode(parent, node, current, ctx);
    removeNode(current, ctx);
    }
    continue;
    }
    insertNode(parent, node, cursor, ctx);
    }
    while (cursor) {
    const stale = cursor;
    cursor = live(stale.nextSibling);
    if (!used.has(stale)) removeNode(stale, ctx);
    }
    for (const old of keyed.values()) {
    if (!used.has(old) && old.parentNode === parent && !leaving(old)) removeNode(old, ctx);
    }
    }
    function morphChildren(target, nodes, options = {}) {
    const ctx = {
    replace: options.replace === true,
    options,
    active: activeIn(target),
    moved: [],
    };
    const restore = keepChoice(ctx.active);
    try {
    patchChildren(target, Array.from(nodes), ctx, true);
    } finally {
    restore?.();
    settleMoved(ctx.moved);
    }
    }
    function settleMoved(moved) {
    if (!moved.length) return;
    const view = moved[0].ownerDocument?.defaultView;
    if (typeof view?.getComputedStyle === 'function') void view.getComputedStyle(moved[0]).opacity;
    for (const node of moved) node.removeAttribute('data-ds-moving');
    }
    const START_TAG = /<!--[\s\S]*?-->|<([a-zA-Z][^\s/>]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g;
    const ATTRIBUTE = /(\s+)([^\s"'>/=]+)((?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)/g;
    const RAW_TEXT = /^(?:script|style|textarea|title|xmp|iframe|noembed|noframes|noscript|plaintext)$/i;
    const STYLE_CARRIER = 'data-ds-style';
    function hideStyles(html) {
    if (!/\sstyle\s*=/i.test(html)) return html;
    let out = '';
    let last = 0;
    START_TAG.lastIndex = 0;
    for (let match = START_TAG.exec(html); match; match = START_TAG.exec(html)) {
    if (!match[1]) continue;
    const attributes = match[2].replace(ATTRIBUTE, (whole, space, name, value) => (name.toLowerCase() === 'style' ? `${space}${STYLE_CARRIER}${value}` : whole));
    out += `${html.slice(last, match.index)}<${match[1]}${attributes}${match[3] ? ' /' : ''}>`;
    last = START_TAG.lastIndex;
    if (RAW_TEXT.test(match[1])) {
    const close = html.toLowerCase().indexOf(`</${match[1].toLowerCase()}`, last);
    START_TAG.lastIndex = close < 0 ? html.length : close;
    }
    }
    return out + html.slice(last);
    }
    function carryStyles(root) {
    for (const element of Array.from(root?.querySelectorAll?.(`[${STYLE_CARRIER}]`) ?? [])) {
    const text = element.getAttribute(STYLE_CARRIER);
    element.removeAttribute(STYLE_CARRIER);
    if (element.style && typeof element.style.setProperty === 'function') element.style.cssText = text;
    else element.setAttribute('style', text);
    }
    }
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';
    function morphHtml(target, html, options = {}) {
    const template = target.ownerDocument.createElement('template');
    const foreign = target.namespaceURI === SVG_NS && target.localName !== 'foreignObject' ? 'svg'
    : target.namespaceURI === MATHML_NS ? 'math' : '';
    const markup = hideStyles(String(html));
    template.innerHTML = foreign ? `<${foreign}>${markup}</${foreign}>` : markup;
    const source = foreign ? template.content.firstChild : template.content;
    carryStyles(source);
    morphChildren(target, Array.from(source?.childNodes ?? []), options);
    }
    function own(element, kind, name) {
    if (!element || typeof element !== 'object') return;
    const record = element[OWNED] ?? (element[OWNED] = { attrs: new Map(), classes: new Map(), props: new Map() });
    record[kind].set(name, (record[kind].get(name) ?? 0) + 1);
    }
    function disown(element, kind, name) {
    const map = element?.[OWNED]?.[kind];
    const count = map?.get(name) ?? 0;
    if (count > 1) map.set(name, count - 1);
    else map?.delete(name);
    }
    const windowOf = (node) => node?.ownerDocument?.defaultView ?? globalThis;
    const idle = () => ({ update() {}, destroy() {} });
    function documentScroller(scroller) {
    const doc = scroller?.ownerDocument;
    return Boolean(doc) && (scroller === doc.scrollingElement || scroller === doc.documentElement || scroller === doc.body);
    }
    const scrollWatches = new WeakMap();
    function scrolledTarget(scroller) {
    const is = (selector) => Boolean(scroller.matches?.(selector));
    if (is('.ds-view')) return scroller.closest('.ds-app') ?? scroller;
    if (is('.ds-sheet__body')) return scroller.closest('.ds-sheet__panel') ?? scroller;
    if (is('.ds-dialog__body')) return scroller.closest('.ds-dialog__box') ?? scroller;
    return scroller;
    }
    function watchScrolled(scroller, target) {
    if (!scroller?.ownerDocument) return idle();
    const existing = scrollWatches.get(scroller);
    if (existing) return existing.handle;
    const doc = scroller.ownerDocument;
    const view = windowOf(scroller);
    const owner = target ?? scrolledTarget(scroller);
    const whole = documentScroller(scroller);
    const sentinel = doc.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.setAttribute('data-ds-keep', '');
    sentinel.setAttribute('data-ds-sentinel', '');
    own(owner, 'attrs', 'data-scrolled');
    const host = () => (whole ? doc.body : scroller);
    const place = () => {
    const style = typeof view.getComputedStyle === 'function' ? view.getComputedStyle(host()) : null;
    if (whole || !style || style.position !== 'static') {
    sentinel.style.cssText = 'position: absolute; top: 0; inset-inline: 0; height: 1px; pointer-events: none';
    } else {
    sentinel.style.cssText = `height: 1px; flex-shrink: 0; margin-bottom: ${-1 - (parseFloat(style.rowGap) || 0)}px`;
    }
    if (sentinel.parentNode !== host()) host().insertBefore(sentinel, host().firstChild);
    };
    const report = (scrolled) => {
    if (scrolled === owner.hasAttribute('data-scrolled')) return;
    if (scrolled) owner.setAttribute('data-scrolled', '');
    else owner.removeAttribute('data-scrolled');
    if (!scrolled) resyncScroll(scroller);
    };
    const texts = !whole && scroller.matches?.('.ds-dialog__body');
    if (texts) own(scroller, 'attrs', 'data-ds-text');
    const markText = () => {
    if (!texts) return;
    const bare = Array.from(scroller.childNodes).some((node) => node.nodeType === 3 && /\S/.test(node.nodeValue ?? ''));
    if (bare !== scroller.hasAttribute('data-ds-text')) scroller.toggleAttribute('data-ds-text', bare);
    };
    const mutations = texts && typeof view.MutationObserver === 'function'
    ? new view.MutationObserver((records) => {
    if (records.some((record) => record.target === scroller || record.target.parentNode === scroller)) markText();
    })
    : null;
    mutations?.observe(scroller, { childList: true, characterData: true, subtree: true });
    let observer = null;
    let onScroll = null;
    const source = whole ? view : scroller;
    if (typeof view.IntersectionObserver === 'function') {
    observer = new view.IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    if (!entry?.boundingClientRect.height) return;
    report(!entry.isIntersecting || entry.intersectionRatio < 0.5);
    }, { root: whole ? null : scroller, threshold: [0, 0.5, 1] });
    } else {
    onScroll = () => report((whole ? view.scrollY : scroller.scrollTop) > 0);
    source.addEventListener?.('scroll', onScroll, { passive: true });
    }
    place();
    markText();
    observer?.observe(sentinel);
    const handle = {
    update() {
    if (scrollWatches.get(scroller)?.handle !== handle) return;
    const back = sentinel.parentNode !== host();
    place();
    markText();
    if (back && observer) {
    observer.unobserve(sentinel);
    observer.observe(sentinel);
    }
    onScroll?.();
    },
    destroy() {
    if (scrollWatches.get(scroller)?.handle !== handle) return;
    scrollWatches.delete(scroller);
    observer?.disconnect();
    mutations?.disconnect();
    if (onScroll) source.removeEventListener?.('scroll', onScroll);
    sentinel.remove();
    disown(owner, 'attrs', 'data-scrolled');
    owner.removeAttribute('data-scrolled');
    if (texts) {
    disown(scroller, 'attrs', 'data-ds-text');
    scroller.removeAttribute('data-ds-text');
    }
    },
    };
    scrollWatches.set(scroller, { handle });
    return handle;
    }
    const edgeWatches = new WeakMap();
    const edgeObservers = new WeakMap();
    function edgeObserver(view) {
    let entry = edgeObservers.get(view);
    if (!entry && typeof view.ResizeObserver === 'function') {
    const targets = new Map();
    const observer = new view.ResizeObserver((records) => {
    const run = new Set();
    for (const record of records) for (const update of targets.get(record.target) ?? []) run.add(update);
    for (const update of run) update();
    });
    entry = { observer, targets };
    edgeObservers.set(view, entry);
    }
    return entry ?? null;
    }
    function watchSize(view, element, update) {
    const entry = edgeObserver(view);
    if (!entry || !element) return;
    const list = entry.targets.get(element) ?? new Set();
    if (!list.size) entry.observer.observe(element);
    list.add(update);
    entry.targets.set(element, list);
    }
    function unwatchSize(view, element, update) {
    const entry = edgeObservers.get(view);
    const list = element ? entry?.targets.get(element) : null;
    if (!list) return;
    list.delete(update);
    if (!list.size) {
    entry.targets.delete(element);
    entry.observer.unobserve(element);
    }
    }
    function flag(element, name, on) {
    if (on === element.hasAttribute(name)) return;
    if (on) element.setAttribute(name, '');
    else element.removeAttribute(name);
    }
    function scrollEdges(scroller, options = {}) {
    if (!scroller?.ownerDocument) return idle();
    const axis = options.axis === 'block' ? 'block' : 'inline';
    const watches = edgeWatches.get(scroller) ?? new Map();
    edgeWatches.set(scroller, watches);
    const existing = watches.get(axis);
    if (existing) return existing.handle;
    const view = windowOf(scroller);
    const inline = axis === 'inline';
    const bar = inline ? '--ds-scrollbar-height' : '--ds-scrollbar-width';
    for (const name of ['data-ds-edges', 'data-ds-overflow-start', 'data-ds-overflow-end']) own(scroller, 'attrs', name);
    for (const name of [bar, '--ds-table-pin-width', '--ds-table-pin-last-width']) own(scroller, 'props', name);
    let frame = 0;
    let overflowed = false;
    const watched = new Set();
    const syncChildren = () => {
    const now = new Set(Array.from(scroller.children ?? []));
    for (const node of watched) {
    if (now.has(node)) continue;
    unwatchSize(view, node, schedule);
    watched.delete(node);
    }
    for (const node of now) {
    if (watched.has(node)) continue;
    watchSize(view, node, schedule);
    watched.add(node);
    }
    };
    const children = typeof view.MutationObserver === 'function'
    ? new view.MutationObserver(() => {
    syncChildren();
    schedule();
    })
    : null;
    const measure = () => {
    frame = 0;
    const size = inline ? scroller.scrollWidth - scroller.clientWidth : scroller.scrollHeight - scroller.clientHeight;
    const at = Math.abs(inline ? scroller.scrollLeft : scroller.scrollTop) || 0;
    const overflow = size > 1;
    flag(scroller, 'data-ds-overflow-start', overflow && at > 1);
    flag(scroller, 'data-ds-overflow-end', overflow && size - at > 1);
    const style = typeof view.getComputedStyle === 'function' ? view.getComputedStyle(scroller) : null;
    const borders = inline
    ? (parseFloat(style?.borderTopWidth) || 0) + (parseFloat(style?.borderBottomWidth) || 0)
    : (parseFloat(style?.borderLeftWidth) || 0) + (parseFloat(style?.borderRightWidth) || 0);
    flag(scroller, 'data-ds-edges', true);
    const room = Math.max(0, (inline ? scroller.offsetHeight - scroller.clientHeight : scroller.offsetWidth - scroller.clientWidth) - borders);
    scroller.style.setProperty(bar, `${Math.round(room)}px`);
    const pinned = scroller.querySelector?.('.ds-table--pin-first') ?? null;
    const first = pinned ? pinned.rows?.[0]?.cells?.[0] ?? pinned.querySelector('th, td') : null;
    if (first) scroller.style.setProperty('--ds-table-pin-width', `${Math.round(first.getBoundingClientRect().width * 100) / 100}px`);
    else scroller.style.removeProperty('--ds-table-pin-width');
    const pinnedEnd = scroller.querySelector?.('.ds-table--pin-last') ?? null;
    const row = pinnedEnd?.rows?.[0]?.cells;
    const last = row?.length ? row[row.length - 1] : pinnedEnd ? [...pinnedEnd.querySelectorAll('th, td')].at(-1) : null;
    if (last) scroller.style.setProperty('--ds-table-pin-last-width', `${Math.round(last.getBoundingClientRect().width * 100) / 100}px`);
    else scroller.style.removeProperty('--ds-table-pin-last-width');
    if (overflowed && !overflow) resyncScroll(scroller);
    overflowed = overflow;
    if (!children) syncChildren();
    };
    const schedule = () => {
    if (frame) return;
    if (typeof view.requestAnimationFrame !== 'function') {
    measure();
    return;
    }
    frame = view.requestAnimationFrame(measure);
    };
    scroller.addEventListener('scroll', schedule, { passive: true });
    watchSize(view, scroller, schedule);
    syncChildren();
    children?.observe(scroller, { childList: true });
    measure();
    const handle = {
    update() {
    if (watches.get(axis)?.handle === handle) measure();
    },
    destroy() {
    if (watches.get(axis)?.handle !== handle) return;
    watches.delete(axis);
    if (frame) view.cancelAnimationFrame?.(frame);
    scroller.removeEventListener('scroll', schedule);
    unwatchSize(view, scroller, schedule);
    children?.disconnect();
    for (const node of watched) unwatchSize(view, node, schedule);
    watched.clear();
    for (const name of ['data-ds-edges', 'data-ds-overflow-start', 'data-ds-overflow-end']) {
    disown(scroller, 'attrs', name);
    if (!watches.size) scroller.removeAttribute(name);
    }
    disown(scroller, 'props', bar);
    disown(scroller, 'props', '--ds-table-pin-width');
    scroller.style.removeProperty(bar);
    if (!watches.size) scroller.style.removeProperty('--ds-table-pin-width');
    if (scroller.getAttribute('style')?.trim() === '') scroller.removeAttribute('style');
    },
    };
    watches.set(axis, { handle, update: measure });
    return handle;
    }
    let warnedText = false;
    function progress(el, share, options = {}) {
    if (!el) return el;
    const list = el.classList;
    const meter = list.contains('ds-meter');
    const spinner = list.contains('ds-spinner');
    const aria = spinner ? el : meter ? (el.getAttribute('role') === 'meter' ? el : null) : el.querySelector?.('.ds-progress__track[role="progressbar"], [role="progressbar"]') ?? null;
    const text = options.valueText;
    if (share === null || share === undefined || !Number.isFinite(Number(share))) {
    if (meter) return el;
    if (spinner) list.remove('ds-spinner--determinate');
    else {
    list.toggle('ds-progress--indeterminate', !options.waiting);
    list.toggle('ds-progress--waiting', Boolean(options.waiting));
    }
    if (aria) {
    aria.removeAttribute('aria-valuenow');
    if (text) aria.setAttribute('aria-valuetext', String(text));
    else {
    aria.removeAttribute('aria-valuetext');
    if (!warnedText) {
    warnedText = true;
    globalThis.console?.warn?.('DS.dom.progress: an unknown share needs a valueText ("Preparing", "Waiting") for assistive tech');
    }
    }
    }
    return el;
    }
    const value = Math.round(Math.min(1, Math.max(0, Number(share))) * 1000) / 1000;
    if (spinner) list.add('ds-spinner--determinate');
    else if (!meter) list.remove('ds-progress--indeterminate', 'ds-progress--waiting');
    ( (el)).style.setProperty(meter ? '--ds-share' : '--ds-progress', String(value));
    if (aria) {
    aria.setAttribute('aria-valuenow', String(Math.round(value * 100)));
    if (text) aria.setAttribute('aria-valuetext', String(text));
    else aria.removeAttribute('aria-valuetext');
    }
    return el;
    }
    const rovers = new WeakMap();
    const ROVING_ITEMS = '[role="tab"], [role="radio"], [role="option"]';
    function roving(container, options = {}) {
    if (!container?.ownerDocument) return { destroy() {} };
    const existing = rovers.get(container);
    if (existing) return existing.handle;
    const selector = options.items ?? ROVING_ITEMS;
    const orientation = options.orientation ?? 'horizontal';
    const wrap = options.wrap !== false;
    const activate = options.activate === undefined ? 'focus' : options.activate;
    const view = windowOf(container);
    const items = () => Array.from(container.querySelectorAll(selector)).filter((item) => !item.matches?.(':disabled') && !item.hidden && !item.closest?.('[hidden], [inert]'));
    const chosen = (item) => ['aria-selected', 'aria-checked', 'aria-pressed'].some((name) => item.getAttribute(name) === 'true') || (item.hasAttribute('aria-current') && item.getAttribute('aria-current') !== 'false');
    let last = null;
    const stop = (current) => {
    last = current;
    for (const item of items()) {
    const value = item === current ? '0' : '-1';
    if (item.getAttribute('tabindex') !== value) item.setAttribute('tabindex', value);
    }
    };
    const restop = () => {
    const all = items();
    const active = container.ownerDocument.activeElement;
    stop(all.find((item) => item === active || item.contains?.(active))
    ?? all.find((item) => item.getAttribute('tabindex') === '0')
    ?? all.find(chosen)
    ?? (all.includes(last) ? last : null)
    ?? all[0] ?? null);
    };
    restop();
    const changes = typeof view.MutationObserver === 'function' ? new view.MutationObserver(restop) : null;
    changes?.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['tabindex', 'aria-selected', 'aria-checked', 'aria-pressed', 'aria-current', 'disabled', 'hidden'] });
    const run = (item) => {
    if (item.getAttribute('aria-disabled') === 'true') return;
    if (typeof options.onActivate === 'function') options.onActivate(item);
    else item.click?.();
    };
    const nearest = (list, from, down) => {
    const box = from.getBoundingClientRect();
    const rows = list.filter((item) => item !== from).map((item) => ({ item, box: item.getBoundingClientRect() }))
    .filter(({ box: other }) => (down ? other.top >= box.bottom - 1 : other.bottom <= box.top + 1));
    if (!rows.length) return null;
    const row = down ? Math.min(...rows.map(({ box: other }) => other.top)) : Math.max(...rows.map(({ box: other }) => other.top));
    const centre = (rect) => rect.left + rect.width / 2;
    return rows.filter(({ box: other }) => Math.abs(other.top - row) < 1)
    .sort((a, b) => Math.abs(centre(a.box) - centre(box)) - Math.abs(centre(b.box) - centre(box)))[0].item;
    };
    const onKey = ( event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const list = items();
    const current = list.find((item) => item === event.target || item.contains(event.target));
    if (!current) return;
    if (event.key === 'Enter' || event.key === ' ') {
    if (activate === 'manual' && current.tagName !== 'BUTTON' && current.tagName !== 'A' && current.tagName !== 'INPUT') {
    event.preventDefault();
    run(current);
    }
    return;
    }
    const rtl = typeof view.getComputedStyle === 'function' && view.getComputedStyle(container).direction === 'rtl';
    const index = list.indexOf(current);
    const step = (by) => {
    const at = index + by;
    if (at >= 0 && at < list.length) return list[at];
    return wrap ? list[(at + list.length) % list.length] : null;
    };
    const across = orientation !== 'vertical';
    const along = orientation !== 'horizontal';
    let next;
    if (event.key === 'Home') next = list[0];
    else if (event.key === 'End') next = list[list.length - 1];
    else if (across && event.key === 'ArrowRight') next = step(rtl ? -1 : 1);
    else if (across && event.key === 'ArrowLeft') next = step(rtl ? 1 : -1);
    else if (along && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    const down = event.key === 'ArrowDown';
    next = orientation === 'both' ? nearest(list, current, down) ?? (wrap ? (down ? list[0] : list[list.length - 1]) : null) : step(down ? 1 : -1);
    } else return;
    event.preventDefault();
    if (!next || next === current) return;
    stop(next);
    next.focus();
    if (activate === 'focus') run(next);
    };
    const onFocus = ( event) => {
    const item = items().find((each) => each === event.target);
    if (item) stop(item);
    };
    container.addEventListener('keydown', onKey);
    container.addEventListener('focusin', onFocus);
    const handle = {
    destroy() {
    if (rovers.get(container)?.handle !== handle) return;
    rovers.delete(container);
    changes?.disconnect();
    container.removeEventListener('keydown', onKey);
    container.removeEventListener('focusin', onFocus);
    },
    };
    rovers.set(container, { handle });
    return handle;
    }
    const KEYBOARD_MIN_PX = 150;
    const viewportFollowers = new WeakMap();
    function frameDocument(frame) {
    try {
    return frame.contentDocument || null;
    } catch {
    return null;
    }
    }
    function typesText(node) {
    if (!node) return false;
    if (node.isContentEditable) return true;
    if (node.tagName === 'TEXTAREA') return !node.readOnly;
    if (node.tagName !== 'INPUT') return false;
    return !node.readOnly && !/^(button|checkbox|color|file|hidden|image|radio|range|reset|submit)$/i.test(node.type);
    }
    function editing(doc) {
    let active = doc.activeElement;
    for (;;) {
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    if (!/^i?frame$/i.test(active?.tagName || '')) break;
    const inner = frameDocument(active);
    if (!inner) return false;
    active = inner.activeElement;
    doc = inner;
    }
    if (!active || active === doc.body) return false;
    return typesText(active);
    }
    function bottomInset(doc, probes) {
    if (!probes.probe) {
    if (!doc.body || typeof doc.createElement !== 'function') return 0;
    const probe = doc.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.setAttribute('data-ds-keep', '');
    probe.style.cssText = 'position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom, 0px);margin:0;border:0;padding:0;visibility:hidden;pointer-events:none';
    probes.probe = probe;
    if (typeof probes.view.ResizeObserver === 'function') {
    probes.sizes = new probes.view.ResizeObserver(probes.changed);
    probes.sizes.observe(probe);
    }
    }
    if (!probes.probe.parentNode || !probes.probe.isConnected) doc.body?.append(probes.probe);
    return probes.probe.parentNode ? probes.probe.getBoundingClientRect().height || 0 : 0;
    }
    function panToTop(root) {
    if (typeof root.scrollIntoView !== 'function') return;
    try {
    root.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
    } catch {
    root.scrollIntoView(true);
    }
    }
    function followViewport(doc = globalThis.document) {
    const view = doc?.defaultView;
    const viewport = view?.visualViewport;
    if (!viewport || !doc.documentElement) return { destroy() {} };
    const existing = viewportFollowers.get(doc);
    if (existing) return existing.handle;
    const root = doc.documentElement;
    const tallest = new Map();
    own(root, 'attrs', 'data-ds-keyboard');
    for (const name of ['--ds-viewport-height', '--ds-keyboard-inset']) own(root, 'props', name);
    let frame = 0;
    let openInset = 0;
    const probes = { view, probe: null, sizes: null, changed: () => schedule() };
    const update = () => {
    frame = 0;
    const scale = viewport.scale || 1;
    const width = Math.round(viewport.width * scale);
    const height = viewport.height;
    const top = Math.max(height, tallest.get(width) ?? 0);
    tallest.set(width, top);
    const layout = view.innerHeight || height;
    const short = top - height > KEYBOARD_MIN_PX;
    const typing = editing(doc);
    const inset = bottomInset(doc, probes);
    if (scale === 1 && layout - height < 2 && !typing) openInset = inset;
    const lost = short && scale === 1 && inset < 0.5 ? openInset : 0;
    root.style.setProperty('--ds-viewport-height', `${Math.round(height - lost)}px`);
    const keyboard = short && typing;
    const covered = Math.max(0, Math.round(layout - height - viewport.offsetTop + lost));
    root.style.setProperty('--ds-keyboard-inset', `${keyboard ? covered : 0}px`);
    if (keyboard !== root.hasAttribute('data-ds-keyboard')) {
    if (keyboard) root.setAttribute('data-ds-keyboard', '');
    else root.removeAttribute('data-ds-keyboard');
    }
    if (keyboard && scale === 1) {
    if ((view.scrollY || 0) > 0 && viewport.offsetTop > 0) view.scrollTo(view.scrollX || 0, 0);
    else if (viewport.offsetTop >= 1) panToTop(root);
    }
    };
    const schedule = () => {
    if (frame) return;
    frame = typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(update) : (update(), 0);
    };
    viewport.addEventListener('resize', schedule);
    viewport.addEventListener('scroll', schedule);
    doc.addEventListener('focusin', schedule);
    doc.addEventListener('focusout', schedule);
    update();
    const handle = {
    destroy() {
    if (viewportFollowers.get(doc)?.handle !== handle) return;
    viewportFollowers.delete(doc);
    if (frame) view.cancelAnimationFrame?.(frame);
    viewport.removeEventListener('resize', schedule);
    viewport.removeEventListener('scroll', schedule);
    doc.removeEventListener('focusin', schedule);
    doc.removeEventListener('focusout', schedule);
    probes.sizes?.disconnect();
    probes.probe?.remove();
    disown(root, 'attrs', 'data-ds-keyboard');
    for (const name of ['--ds-viewport-height', '--ds-keyboard-inset']) {
    disown(root, 'props', name);
    root.style.removeProperty(name);
    }
    root.removeAttribute('data-ds-keyboard');
    if (root.getAttribute('style')?.trim() === '') root.removeAttribute('style');
    },
    };
    viewportFollowers.set(doc, { handle });
    return handle;
    }
    const endFollowers = new WeakMap();
    function followEnd(scroller, options = {}) {
    if (!scroller?.ownerDocument) return { stick() {}, destroy() {} };
    const existing = endFollowers.get(scroller);
    if (existing) return existing.handle;
    const view = windowOf(scroller);
    const pill = options.pill ?? null;
    const threshold = Math.max(0, Number(options.threshold ?? 1));
    const gap = () => scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
    let stuck = gap() <= threshold;
    let last = scroller.scrollTop;
    const show = () => {
    if (pill && pill.hidden !== stuck) pill.hidden = stuck;
    };
    const toEnd = (smooth) => {
    const end = scroller.scrollHeight - scroller.clientHeight;
    if (smooth && typeof scroller.scrollTo === 'function') {
    last = scroller.scrollTop;
    scroller.scrollTo({ top: end, behavior: 'smooth' });
    } else {
    scroller.scrollTop = end;
    last = end;
    }
    };
    const onScroll = () => {
    const top = scroller.scrollTop;
    if (gap() <= threshold) stuck = true;
    else if (top < last - 0.5) stuck = false;
    last = top;
    show();
    };
    const grew = () => {
    if (stuck && gap() > threshold) toEnd(false);
    last = scroller.scrollTop;
    show();
    };
    const sizes = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(grew) : null;
    const children = typeof view.MutationObserver === 'function' ? new view.MutationObserver((records) => {
    for (const record of records) {
    for (const node of Array.from(record.removedNodes ?? [])) if (node.nodeType === 1 && node.parentNode !== scroller) sizes?.unobserve(node);
    for (const node of Array.from(record.addedNodes ?? [])) if (node.nodeType === 1 && node.parentNode === scroller) sizes?.observe(node);
    }
    grew();
    }) : null;
    for (const child of Array.from(scroller.children ?? [])) sizes?.observe(child);
    sizes?.observe(scroller);
    children?.observe(scroller, { childList: true });
    scroller.addEventListener('scroll', onScroll, { passive: true });
    const stick = () => {
    stuck = true;
    toEnd(gap() <= scroller.clientHeight);
    show();
    };
    const onPill = () => stick();
    pill?.addEventListener('click', onPill);
    if (pill) own(pill, 'attrs', 'hidden');
    show();
    const handle = {
    stick,
    destroy() {
    if (endFollowers.get(scroller)?.handle !== handle) return;
    endFollowers.delete(scroller);
    sizes?.disconnect();
    children?.disconnect();
    scroller.removeEventListener('scroll', onScroll);
    pill?.removeEventListener('click', onPill);
    if (pill) disown(pill, 'attrs', 'hidden');
    },
    };
    endFollowers.set(scroller, { handle });
    return handle;
    }
    const autosized = new WeakMap();
    function autosize(textarea) {
    if (!textarea?.ownerDocument) return idle();
    const existing = autosized.get(textarea);
    if (existing) return existing.handle;
    const view = windowOf(textarea);
    const style = () => (typeof view.getComputedStyle === 'function' ? view.getComputedStyle(textarea) : null);
    const native = () => style()?.getPropertyValue?.('field-sizing') === 'content';
    let owned = false;
    const release = () => {
    if (owned) {
    owned = false;
    disown(textarea, 'props', 'height');
    disown(textarea, 'props', 'overflow-y');
    }
    textarea.style.removeProperty('height');
    textarea.style.removeProperty('overflow-y');
    if (textarea.getAttribute('style')?.trim() === '') textarea.removeAttribute('style');
    };
    const update = () => {
    if (textarea.isConnected === false || typeof textarea.getClientRects === 'function' && !textarea.getClientRects().length) return;
    if (native()) {
    if (owned) release();
    return;
    }
    if (!owned) {
    owned = true;
    own(textarea, 'props', 'height');
    own(textarea, 'props', 'overflow-y');
    }
    const computed = style();
    const borders = computed?.boxSizing === 'border-box' ? (parseFloat(computed.borderTopWidth) || 0) + (parseFloat(computed.borderBottomWidth) || 0) : 0;
    const max = parseFloat(computed?.maxHeight);
    textarea.style.height = 'auto';
    const wanted = textarea.scrollHeight + borders;
    const capped = Number.isFinite(max) && max > 0 ? Math.min(wanted, max) : wanted;
    textarea.style.height = `${Math.ceil(capped)}px`;
    textarea.style.overflowY = Number.isFinite(max) && wanted > max ? 'auto' : 'hidden';
    };
    let width = -1;
    let frame = 0;
    const sizes = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver((entries) => {
    const inline = entries[entries.length - 1]?.contentRect?.width ?? 0;
    if (inline === width) return;
    width = inline;
    if (inline > 0 && !frame) frame = view.requestAnimationFrame(() => { frame = 0; update(); });
    }) : null;
    sizes?.observe(textarea);
    textarea.addEventListener('input', update);
    update();
    const handle = {
    update,
    destroy() {
    if (autosized.get(textarea)?.handle !== handle) return;
    autosized.delete(textarea);
    sizes?.disconnect();
    if (frame) view.cancelAnimationFrame(frame);
    textarea.removeEventListener('input', update);
    release();
    },
    };
    autosized.set(textarea, { handle });
    return handle;
    }
    const dropzones = new WeakMap();
    const carriesFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes('Files');
    function accepts(file, accept) {
    const rules = String(accept ?? '').split(',').map((rule) => rule.trim().toLowerCase()).filter(Boolean);
    if (!rules.length) return true;
    const name = String(file?.name ?? '').toLowerCase();
    const type = String(file?.type ?? '').toLowerCase();
    return rules.some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
    });
    }
    function dropzone(zone, options) {
    if (!zone?.ownerDocument) return { destroy() {} };
    const existing = dropzones.get(zone);
    if (existing) return existing.handle;
    const doc = zone.ownerDocument;
    const target = options?.target ?? zone;
    const input = options?.input !== undefined
    ? options.input
    : zone.querySelector?.('.ds-dropzone__input') ?? zone.querySelector?.('input[type="file"]') ?? null;
    const accept = () => options?.accept ?? input?.accept ?? '';
    const multiple = () => options?.multiple ?? Boolean(input?.multiple);
    const blocked = () => Boolean(input?.disabled);
    let depth = 0;
    own(zone, 'attrs', 'data-ds-dragover');
    const over = (on) => {
    if (on === zone.hasAttribute('data-ds-dragover')) return;
    if (on) zone.setAttribute('data-ds-dragover', '');
    else zone.removeAttribute('data-ds-dragover');
    };
    const hand = (list, event) => {
    const files = Array.from(list ?? []).filter((file) => accepts(file, accept()));
    const taken = multiple() ? files : files.slice(0, 1);
    if (taken.length) options?.onFiles?.(taken, event);
    return taken.length > 0;
    };
    const onEnter = (event) => {
    if (!carriesFiles(event) || blocked()) return;
    event.preventDefault();
    depth += 1;
    over(true);
    };
    const onOver = (event) => {
    if (!carriesFiles(event) || blocked()) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };
    const onLeave = (event) => {
    if (!carriesFiles(event)) return;
    depth = Math.max(0, depth - 1);
    if (!depth) over(false);
    };
    const onDrop = (event) => {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    depth = 0;
    over(false);
    if (!blocked()) hand(event.dataTransfer?.files, event);
    };
    const onChange = (event) => {
    hand(input.files, event);
    input.value = '';
    };
    const onPaste = (event) => {
    if (blocked() || !target.contains?.(doc.activeElement) && doc.activeElement !== target) return;
    const files = event.clipboardData?.files;
    if (!files?.length) return;
    if (hand(files, event)) event.preventDefault();
    };
    target.addEventListener('dragenter', onEnter);
    target.addEventListener('dragover', onOver);
    target.addEventListener('dragleave', onLeave);
    target.addEventListener('drop', onDrop);
    input?.addEventListener('change', onChange);
    if (options?.paste) doc.addEventListener('paste', onPaste);
    const handle = {
    destroy() {
    if (dropzones.get(zone)?.handle !== handle) return;
    dropzones.delete(zone);
    target.removeEventListener('dragenter', onEnter);
    target.removeEventListener('dragover', onOver);
    target.removeEventListener('dragleave', onLeave);
    target.removeEventListener('drop', onDrop);
    input?.removeEventListener('change', onChange);
    doc.removeEventListener('paste', onPaste);
    disown(zone, 'attrs', 'data-ds-dragover');
    zone.removeAttribute('data-ds-dragover');
    },
    };
    dropzones.set(zone, { handle });
    return handle;
    }

    return Object.freeze({
      morphChildren: morphChildren,
      morphHtml: morphHtml,
      own: own,
      disown: disown,
      watchScrolled: watchScrolled,
      scrollEdges: scrollEdges,
      progress: progress,
      roving: roving,
      typesText: typesText,
      followViewport: followViewport,
      followEnd: followEnd,
      autosize: autosize,
      dropzone: dropzone
    });
  });

  add('ripple', ['RIPPLE_HOSTS', 'attach'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, runtime = DS.core.runtime;
    const flip = DS.motion.flip, guard = DS.motion.guard, motionDuration = DS.motion.motionDuration, motionEasing = DS.motion.motionEasing, settled = DS.motion.settled, travelDuration = DS.motion.travelDuration;
    const RIPPLE_HOSTS = [
    '.ds-pressable',
    '.ds-btn',
    '.ds-disclosure > summary',
    '.ds-errors summary',
    ':is(button, a).ds-columns__col',
    '.ds-chart__key',
    ':is(button, a).ds-tile',
    '.ds-list--interactive > .ds-list__item',
    ':is(a, button).ds-kv-list__row',
    '.ds-list[data-ds-list-select] > .ds-list__item:not(:has(.ds-list__action)):not(:has(> .ds-list__check:disabled))',
    '.ds-card--interactive',
    '.ds-menu__item',
    '.ds-chip',
    '.ds-table__sort',
    '.ds-table--interactive tbody tr:not(.ds-table__detail):has(.ds-table__row-link)',
    '.ds-radio',
    '.ds-check-card:not(:has(input:is(:disabled,[aria-disabled="true"])))',
    '.ds-dropzone',
    '.ds-combo__toggle',
    '.ds-combo__clear',
    '.ds-segmented__option',
    '.ds-drawer__item',
    '.ds-drawer__toggle',
    '.ds-tabs__tab',
    '.ds-steps__link',
    '.ds-calendar__day',
    '.ds-picker__preset',
    '.ds-tree__item:not([aria-disabled="true"]) > .ds-tree__row',
    '.ds-toc__link',
    '[data-ds-ripple]',
    ].join(', ');
    const HOST_LINK = [
    '.ds-table__row-link',
    '.ds-card__action',
    '.ds-list__action',
    ].join(', ');
    const OWNS_INPUT = [
    '.ds-chip',
    '.ds-radio',
    '.ds-check-card',
    ].join(', ');
    const OWN_PRESS = 'input[type="checkbox"], input[type="radio"], .ds-switch';
    const STRETCHED = [
    '.ds-card--interactive',
    '.ds-table--interactive tbody tr:has(.ds-table__row-link)',
    '.ds-list--interactive > .ds-list__item',
    ].join(', ');
    const CONTROLS = 'a[href], button, input, select, textarea, label, summary, [tabindex]';
    const presses = new WeakMap();
    const pressing = new Set();
    const attached = runtime.state('ripple', () => new WeakMap());
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    function hostOf(target, root) {
    const element = target?.nodeType === 1 ? target : target?.parentElement;
    const host = element?.closest?.(RIPPLE_HOSTS);
    if (!host || !root.contains(host)) return null;
    if (host.closest('[data-ds-ripple="off"]')) return null;
    return host;
    }
    function surfaceOf(host) {
    return host.classList.contains('ds-chip') ? host.querySelector('.ds-chip__body') : host;
    }
    function holderOf(surface) {
    if (surface.tagName !== 'TR') return surface;
    return (pinnedCell(surface) ? surface.cells[1] : null) ?? surface.cells[0] ?? null;
    }
    const PINNED_ROW = '.ds-table--pin-first.ds-table--interactive tbody tr:not(.ds-table__detail)';
    function stuck(row, cell, pin) {
    if (!cell || row.cells.length < 2 || !row.closest(pin)) return null;
    return row.ownerDocument.defaultView?.getComputedStyle(cell).position === 'sticky' ? cell : null;
    }
    const pinnedCell = (row) => stuck(row, row.cells?.[0], '.ds-table--pin-first');
    const pinnedLastCell = (row) => stuck(row, row.cells?.[row.cells.length - 1], '.ds-table--pin-last');
    function inPinnedRoom(row, element) {
    const cell = pinnedLastCell(row);
    if (!cell?.contains(element)) return false;
    const control = element.closest(CONTROLS);
    return !(control && cell.contains(control));
    }
    function rippleSpan(doc, x, y, radius) {
    const span = doc.createElement('span');
    span.className = 'ds-press-ripple';
    span.setAttribute('aria-hidden', 'true');
    span.setAttribute('data-ds-keep', '');
    span.style.setProperty('--ds-ripple-x', `${Math.round(x * 100) / 100}px`);
    span.style.setProperty('--ds-ripple-y', `${Math.round(y * 100) / 100}px`);
    span.style.setProperty('--ds-ripple-r', `${Math.round(radius * 100) / 100}px`);
    return span;
    }
    function pinnedPart(row, cell, rect, left, top, radius) {
    const box = cell.getBoundingClientRect();
    const part = rippleSpan(row.ownerDocument, left + rect.left - box.left, top + rect.top - box.top, radius);
    if (cell === row.cells[0]) cell.append(part);
    else cell.prepend(part);
    return part;
    }
    function forwardRowClick(event, root, ownPrevent = false) {
    if ((event.defaultPrevented && !ownPrevent) || (event.button !== 0 && event.button !== 1)) return false;
    const element = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    const row = element?.closest?.(PINNED_ROW);
    if (!row || !root.contains(row)) return false;
    const control = element.closest(CONTROLS);
    if (control && row.contains(control)) return false;
    if (inPinnedRoom(row, element)) return false;
    const link = row.querySelector('.ds-table__row-link');
    if (!link || link.matches(':disabled') || link.getAttribute('aria-disabled') === 'true') return false;
    const view = row.ownerDocument.defaultView;
    const selection = view?.getSelection?.();
    if (selection && !selection.isCollapsed && !(event.ctrlKey || event.metaKey || event.button === 1)) return false;
    const away = event.button === 1 || event.ctrlKey || event.metaKey || event.shiftKey;
    if (away) {
    if (!link.matches('a[href]')) {
    if (event.button !== 0) return false;
    link.click();
    return true;
    }
    event.preventDefault();
    view?.open( (link).href, '_blank', 'noopener');
    return true;
    }
    link.click();
    return true;
    }
    const blocked = (element) => Boolean(element && (element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true'));
    function inactive(host) {
    if (blocked(host) || host.getAttribute('aria-busy') === 'true') return true;
    if (host.classList.contains('ds-btn--done') || host.classList.contains('ds-radio--disabled')) return true;
    if (host.matches(OWNS_INPUT) && blocked(host.querySelector('input'))) return true;
    if (host.matches(STRETCHED)) {
    const link = host.querySelector(HOST_LINK);
    if (link && blocked(link)) return true;
    }
    return false;
    }
    function pressesOther(host, target) {
    if (!host.matches(STRETCHED)) return false;
    const element = target?.nodeType === 1 ? target : target?.parentElement;
    const control = element?.closest?.(CONTROLS);
    return Boolean(control && control !== host && host.contains(control) && !control.matches(HOST_LINK));
    }
    function fade(span) {
    span.classList.add('ds-press-ripple--out');
    settled(span, { event: 'transitionend', property: 'opacity' }).then(() => span.remove());
    }
    function release(host, press) {
    if (press.released) return;
    press.released = true;
    press.stop?.();
    pressing.delete(host);
    const wait = Math.max(0, motionDuration(host, '--ds-dur-instant') - (now() - press.at));
    setTimeout(() => {
    if (presses.get(host) === press) {
    presses.delete(host);
    host.classList.remove('ds-pressed');
    }
    fade(press.span);
    press.twins?.forEach(fade);
    }, wait);
    }
    function start(host, x, y) {
    const surface = surfaceOf(host);
    if (!surface) return null;
    const view = surface.ownerDocument?.defaultView;
    const style = view?.getComputedStyle(surface);
    if (style?.position === 'static' && style.transform === 'none') return null;
    const previous = presses.get(host);
    if (previous && !previous.released) {
    previous.released = true;
    previous.stop?.();
    fade(previous.span);
    previous.twins?.forEach(fade);
    }
    const holder = holderOf(surface);
    if (!holder) return null;
    const rect = surface.getBoundingClientRect();
    const row = surface !== holder;
    const scaleX = !row && surface.offsetWidth ? rect.width / surface.offsetWidth : 1;
    const scaleY = !row && surface.offsetHeight ? rect.height / surface.offsetHeight : 1;
    const width = row ? rect.width : surface.clientWidth;
    const height = row ? rect.height : surface.clientHeight;
    const left = x === undefined ? width / 2 : (x - rect.left) / (scaleX || 1) - (row ? 0 : surface.clientLeft);
    const top = y === undefined ? height / 2 : (y - rect.top) / (scaleY || 1) - (row ? 0 : surface.clientTop);
    const radius = Math.hypot(Math.max(left, width - left), Math.max(top, height - top));
    const first = row ? pinnedCell(surface) : null;
    const last = row ? pinnedLastCell(surface) : null;
    let span;
    if (holder === last) {
    span = pinnedPart(surface, last, rect, left, top, radius);
    } else {
    span = rippleSpan(surface.ownerDocument, left, top, radius);
    if (row) span.style.height = `${Math.round(height * 100) / 100}px`;
    holder.append(span);
    }
    const twins = [first, holder === last ? null : last].filter(Boolean)
    .map((cell) => pinnedPart(surface, cell, rect, left, top, radius));
    host.classList.add('ds-pressed');
    const press = { span, at: now(), released: false };
    if (twins.length) press.twins = twins;
    presses.set(host, press);
    pressing.add(host);
    return press;
    }
    function end(host) {
    const press = presses.get(host);
    if (press) release(host, press);
    }
    const slotGlides = new WeakMap();
    function timeOf(text) {
    const match = /^\s*(-?\d*\.?\d+)(m?s)\s*$/.exec(String(text ?? '').split(',')[0]);
    return match ? Number(match[1]) * (match[2] === 's' ? 1000 : 1) : 0;
    }
    function easingOf(text) {
    const match = /^\s*([\w-]+\([^)]*\)|[\w-]+)/.exec(String(text ?? ''));
    return match ? match[1] : 'ease';
    }
    function glideSlot(body, from, to, timing) {
    if (Math.abs(from - to) < 0.5 || !(timing.duration > 0) || typeof body.animate !== 'function') return;
    try {
    const animation = body.animate([{ width: `${from}px` }, { width: `${to}px` }], {
    pseudoElement: '::after',
    duration: timing.duration,
    delay: timing.delay,
    easing: timing.easing,
    fill: 'backwards',
    });
    animation.id = 'ds-chip-slot';
    slotGlides.set(body, animation);
    const done = () => {
    if (slotGlides.get(body) === animation) slotGlides.delete(body);
    };
    animation.finished.then(done, done);
    } catch {
    }
    }
    const edgeGlides = new WeakMap();
    function insetRight(clip) {
    const match = /^inset\(([^)]*)\)/.exec(String(clip ?? '').trim());
    if (!match) return 0;
    const sides = match[1].split(/\s+round\s+/)[0].trim().split(/\s+/).map((value) => parseFloat(value) || 0);
    return sides.length > 1 ? sides[1] : sides[0] ?? 0;
    }
    function translateX(value) {
    return parseFloat(String(value ?? '').split(/\s+/)[0]) || 0;
    }
    function labelsOf(body) {
    return Array.from(body.children).filter((child) => !child.matches('.ds-chip__check, .ds-press-ripple'));
    }
    function edgeState(body) {
    const view = body.ownerDocument.defaultView;
    const label = labelsOf(body)[0];
    return { clip: insetRight(view.getComputedStyle(body).clipPath), shift: label ? translateX(view.getComputedStyle(label).translate) : 0 };
    }
    function stopEdge(body) {
    for (const animation of edgeGlides.get(body) ?? []) animation.cancel();
    edgeGlides.delete(body);
    }
    function glideEdge(body, grow, shift, timing) {
    if (typeof body.animate !== 'function' || (Math.abs(grow) < 0.5 && Math.abs(shift) < 0.5)) return;
    const view = body.ownerDocument.defaultView;
    const style = view.getComputedStyle(body);
    const radius = parseFloat(style.borderTopRightRadius) || 0;
    const ring = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
    ? Math.max(0, parseFloat(style.outlineOffset) || 0) + parseFloat(style.outlineWidth) + 1
    : 0;
    const clip = (right) => `inset(${-ring}px ${Math.round(right * 100) / 100}px ${-ring}px ${-ring}px round ${radius + ring}px)`;
    const options = { duration: timing.duration, easing: timing.easing };
    const running = [];
    try {
    running.push(body.animate([{ clipPath: clip(Math.max(0, grow)) }, { clipPath: clip(0) }], options));
    if (Math.abs(shift) >= 0.5) {
    for (const label of labelsOf(body)) running.push(label.animate([{ translate: `${Math.round(shift * 100) / 100}px 0px` }, { translate: '0px 0px' }], options));
    }
    } catch {
    for (const animation of running) animation.cancel();
    return;
    }
    for (const animation of running) animation.id = 'ds-chip-edge';
    edgeGlides.set(body, running);
    const done = () => {
    if (edgeGlides.get(body) === running) edgeGlides.delete(body);
    };
    Promise.allSettled(running.map((animation) => animation.finished)).then(done);
    }
    function flipTiming(element) {
    const animation = element?.getAnimations?.().find((item) => item.id === 'ds-flip' && item.playState !== 'finished' && item.playState !== 'idle');
    const timing = animation?.effect?.getTiming?.();
    return timing && Number(timing.duration) > 0 ? { duration: Number(timing.duration), easing: timing.easing || 'linear' } : null;
    }
    const OWNED = Symbol.for('ds.owned');
    function own(element, kind, name) {
    if (!element || typeof element !== 'object') return;
    const record = element[OWNED] ?? (element[OWNED] = { attrs: new Map(), classes: new Map(), props: new Map() });
    record[kind].set(name, (record[kind].get(name) ?? 0) + 1);
    }
    function disown(element, kind, name) {
    const map = element?.[OWNED]?.[kind];
    const count = map?.get(name) ?? 0;
    if (count > 1) map.set(name, count - 1);
    else map?.delete(name);
    }
    const backedRows = new WeakSet();
    function paints(colour) {
    if (!colour || colour === 'transparent') return false;
    const inner = /\(([^)]*)\)/.exec(colour)?.[1] ?? '';
    const slash = inner.split('/');
    if (slash.length > 1) return parseFloat(slash[1]) > 0;
    const parts = inner.split(',');
    return parts.length === 4 ? parseFloat(parts[3]) > 0 : true;
    }
    function backdropOf(element) {
    const view = element.ownerDocument.defaultView;
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
    const colour = view.getComputedStyle(node).backgroundColor;
    if (paints(colour)) return colour;
    }
    return '';
    }
    function backChips(row) {
    if (!backedRows.has(row)) {
    backedRows.add(row);
    own(row, 'attrs', 'data-ds-glide');
    own(row, 'props', '--ds-chips-backdrop');
    }
    const backdrop = backdropOf(row);
    if (backdrop) row.style.setProperty('--ds-chips-backdrop', backdrop);
    else row.style.removeProperty('--ds-chips-backdrop');
    row.setAttribute('data-ds-glide', '');
    }
    function unbackChips(row) {
    const running = Array.from(row.children).flatMap((child) => child.getAnimations?.() ?? [])
    .filter((animation) => animation.id === 'ds-flip' && animation.playState !== 'finished' && animation.playState !== 'idle');
    if (running.length) {
    Promise.allSettled(running.map((animation) => animation.finished)).then(() => unbackChips(row));
    return;
    }
    row.removeAttribute('data-ds-glide');
    row.style.removeProperty('--ds-chips-backdrop');
    if (backedRows.delete(row)) {
    disown(row, 'attrs', 'data-ds-glide');
    disown(row, 'props', '--ds-chips-backdrop');
    }
    }
    function chipToggled(row) {
    const view = row.ownerDocument.defaultView;
    const bodies = Array.from(row.querySelectorAll('.ds-chip__body'));
    const children = Array.from(row.children);
    const tops = children.map((child) => child.getBoundingClientRect().top);
    const edges = bodies.map((body) => {
    const state = edgeGlides.has(body) ? edgeState(body) : { clip: 0, shift: 0 };
    stopEdge(body);
    return state;
    });
    let wrapped = false;
    let toggled = [];
    const glide = flip(row, () => {
    const slots = bodies.map((body) => {
    const style = view.getComputedStyle(body, '::after');
    return {
    body,
    from: parseFloat(style.width) || 0,
    timing: { duration: timeOf(style.transitionDuration), delay: timeOf(style.transitionDelay), easing: easingOf(style.transitionTimingFunction) },
    };
    });
    for (const body of bodies) {
    slotGlides.get(body)?.cancel();
    slotGlides.delete(body);
    }
    row.setAttribute('data-ds-snap', '');
    wrapped = children.some((child, index) => Math.abs(child.getBoundingClientRect().top - tops[index]) > 1);
    const ends = slots.map((slot) => parseFloat(view.getComputedStyle(slot.body, '::after').width) || 0);
    if (wrapped) {
    toggled = slots.map((slot, index) => {
    const grow = ends[index] - slot.from;
    const chip = slot.body.closest('.ds-chip');
    const next = chip?.parentElement === row ? chip.nextElementSibling : null;
    const same = next && Math.abs(next.getBoundingClientRect().top - chip.getBoundingClientRect().top) <= 1;
    return { body: slot.body, grow: grow + edges[index].clip, shift: edges[index].shift - grow, next: same ? next : null };
    }).filter((entry) => Math.abs(entry.grow) >= 0.5 || Math.abs(entry.shift) >= 0.5);
    }
    row.removeAttribute('data-ds-snap');
    if (wrapped) {
    backChips(row);
    return;
    }
    slots.forEach((slot, index) => glideSlot(slot.body, slot.from, ends[index], slot.timing));
    });
    if (!wrapped) return;
    for (const entry of toggled) {
    const timing = flipTiming(entry.next) ?? {
    duration: travelDuration(row, Math.abs(entry.grow)),
    easing: motionEasing(row, '--ds-ease-spatial'),
    };
    glideEdge(entry.body, entry.grow, entry.shift, timing);
    }
    glide.then(() => unbackChips(row), () => unbackChips(row));
    }
    function activates(target, key) {
    if (key === ' ') return target.tagName !== 'A';
    if (key === 'Enter') return !target.matches?.('input[type="checkbox"], input[type="radio"]');
    return false;
    }
    const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock']);
    function watchInput(doc) {
    const key = Symbol.for('ds.input');
    if (typeof doc?.addEventListener !== 'function' || doc[key]) return;
    const record = (doc[key] = { last: '' });
    for (const type of ['pointerdown', 'mousedown']) doc.addEventListener(type, () => { record.last = 'pointer'; }, { capture: true, passive: true });
    doc.addEventListener('keydown', ( event) => {
    if (!MODIFIER_KEYS.has(event.key)) record.last = 'key';
    }, true);
    }
    function attach(root = document) {
    const existing = attached.get(root);
    if (existing) return existing;
    const element = (root.nodeType === 9 ? (root).documentElement : root);
    const marked = root.nodeType === 11 ? (root).querySelector('.ds-theme') ?? (root).host : element;
    const doc = element.ownerDocument;
    watchInput(doc);
    const blurs = new WeakMap();
    const onPointerDown = ( event) => {
    if (event.button !== 0 || event.isPrimary === false) return;
    const host = hostOf(event.target, element);
    if (!host || inactive(host)) return;
    const target = (event.target);
    if (target.closest?.(OWN_PRESS) && !host.matches(OWNS_INPUT)) return;
    if (pressesOther(host, target) || inPinnedRoom(host, target)) return;
    const press = start(host, event.clientX, event.clientY);
    if (!press) return;
    const pointer = event.pointerId;
    const stop = () => {
    host.removeEventListener('pointerleave', up);
    doc.removeEventListener('pointerup', up, true);
    doc.removeEventListener('pointercancel', up, true);
    doc.removeEventListener('gotpointercapture', captured, true);
    };
    const up = () => {
    stop();
    end(host);
    };
    const captured = ( capture) => {
    if (capture.pointerId !== pointer) return;
    const owner = (capture.target);
    if (owner && owner.nodeType === 1 && host.contains(owner)) return;
    up();
    };
    press.stop = stop;
    host.addEventListener('pointerleave', up);
    doc.addEventListener('pointerup', up, true);
    doc.addEventListener('pointercancel', up, true);
    doc.addEventListener('gotpointercapture', captured, true);
    };
    const onKeyDown = ( event) => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
    const target = (event.target);
    const host = hostOf(target, element);
    if (!host || inactive(host) || !activates(target, event.key)) return;
    if (target !== host && !(host.matches(OWNS_INPUT) && target.tagName === 'INPUT') && !target.matches?.(HOST_LINK)) return;
    if (!start(host)) return;
    const stale = blurs.get(target);
    if (stale) target.removeEventListener('blur', stale);
    const leave = () => {
    blurs.delete(target);
    target.removeEventListener('blur', leave);
    end(host);
    };
    blurs.set(target, leave);
    target.addEventListener('blur', leave);
    };
    const onKeyUp = ( event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = (event.target);
    const pending = blurs.get(target);
    if (pending) {
    target.removeEventListener('blur', pending);
    blurs.delete(target);
    }
    const host = hostOf(target, element);
    if (host) end(host);
    };
    const onTouchStart = () => {};
    let middleRow = null;
    const onRowClick = ( event) => {
    const own = event.type === 'auxclick' && middleRow !== null && middleRow.contains( (event.target));
    if (event.type === 'auxclick') middleRow = null;
    forwardRowClick(event, element, own);
    };
    const onRowMouseDown = ( event) => {
    middleRow = null;
    if (event.button !== 1 || event.defaultPrevented) return;
    const target = (event.target);
    const node = target?.nodeType === 1 ? target : target?.parentElement;
    const row = node?.closest?.(PINNED_ROW);
    if (!row || !element.contains(row) || !row.querySelector('a[href].ds-table__row-link') || node.closest(CONTROLS) || inPinnedRoom(row, node)) return;
    event.preventDefault();
    middleRow = row;
    };
    const onChange = ( event) => {
    const input = (event.target);
    if (!input?.matches?.('.ds-chip__input')) return;
    const row = input.closest('.ds-chips');
    if (row && element.contains(row)) chipToggled(row);
    };
    marked.classList.add('ds-ripples');
    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('keydown', onKeyDown);
    element.addEventListener('keyup', onKeyUp);
    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('change', onChange);
    element.addEventListener('click', onRowClick);
    element.addEventListener('auxclick', onRowClick);
    element.addEventListener('mousedown', onRowMouseDown);
    const rootNode = root.nodeType === 9 || root.nodeType === 11 ? root : element.getRootNode?.() ?? doc;
    const guarded = guard( (rootNode));
    const handle = {
    destroy() {
    if (attached.get(root) !== handle) return;
    attached.delete(root);
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('keydown', onKeyDown);
    element.removeEventListener('keyup', onKeyUp);
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('change', onChange);
    element.removeEventListener('click', onRowClick);
    element.removeEventListener('auxclick', onRowClick);
    element.removeEventListener('mousedown', onRowMouseDown);
    guarded.destroy();
    marked.classList.remove('ds-ripples');
    },
    release(host) {
    const hosts = host ? [host] : [...pressing].filter((item) => element.contains(item));
    for (const item of hosts) end(item);
    },
    };
    attached.set(root, handle);
    return handle;
    }
    define('ripple', {
    global(root) {
    const existed = attached.has(root);
    const handle = attach(root);
    return existed ? () => {} : () => handle.destroy();
    },
    });

    return Object.freeze({
      RIPPLE_HOSTS: RIPPLE_HOSTS,
      attach: attach
    });
  });

  add('icons', ['close', 'moreVertical', 'check', 'checkCircle', 'alertCircle', 'info', 'moon', 'laptop', 'monitor', 'smartphone', 'tablet', 'ICON_SIZE', 'icon', 'iconElement', 'fill'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const close = '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>';
    const moreVertical = '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>';
    const check = '<path pathLength="1" d="M4 12l5 5L20 6"/>';
    const checkCircle = '<circle cx="12" cy="12" r="10"/><path pathLength="1" d="m9 12 2 2 4-4"/>';
    const alertCircle = '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>';
    const info = '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>';
    const moon = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>';
    const laptop = '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>';
    const monitor = '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>';
    const smartphone = '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>';
    const tablet = '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M12 18h.01"/>';
    const ICON_SIZE = 20;
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const ELEMENT = /<([a-z]+)((?:\s+[\w:-]+="[^"]*")*)\s*\/>/g;
    const ATTRIBUTE = /([\w:-]+)="([^"]*)"/g;
    function checkGlyph(body) {
    if (typeof body !== 'string' || body.charAt(0) !== '<') throw new Error('Unknown icon: ' + body);
    }
    const ESCAPES = { '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' };
    function escapeAttribute(value) {
    return String(value).replace(/[&"<>]/g, (char) => ESCAPES[char]);
    }
    function icon(body, size, className) {
    checkGlyph(body);
    const px = size || ICON_SIZE;
    const cls = className ? ` class="${escapeAttribute(className)}"` : '';
    return `<svg${cls} width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
    }
    function iconElement(body, size, className, doc) {
    checkGlyph(body);
    const d = doc || document;
    const px = String(size || ICON_SIZE);
    const svg = d.createElementNS(SVG_NS, 'svg');
    const attributes = [
    ['width', px], ['height', px], ['viewBox', '0 0 24 24'], ['fill', 'none'], ['stroke', 'currentColor'],
    ['stroke-width', '2'], ['stroke-linecap', 'round'], ['stroke-linejoin', 'round'], ['aria-hidden', 'true'],
    ];
    if (className) attributes.unshift(['class', className]);
    for (const pair of attributes) svg.setAttribute(pair[0], pair[1]);
    for (const element of body.matchAll(ELEMENT)) {
    const child = d.createElementNS(SVG_NS, element[1]);
    for (const attribute of element[2].matchAll(ATTRIBUTE)) child.setAttribute(attribute[1], attribute[2]);
    svg.appendChild(child);
    }
    return svg;
    }
    const GLYPHS = {
    close, moreVertical, check, checkCircle, alertCircle, info, moon, laptop, monitor, smartphone, tablet
    };
    const filled = new WeakMap();
    function fill(root) {
    const scope = root || document;
    const doc = scope.nodeType === 9 ? (scope) : scope.ownerDocument;
    const targets = Array.from(scope.querySelectorAll('[data-icon]'));
    if (scope.nodeType === 1 && (scope).hasAttribute('data-icon')) targets.unshift( (scope));
    const unknown = [];
    let drawn = 0;
    for (const target of targets) {
    const name = target.getAttribute('data-icon') || '';
    const body = Object.prototype.hasOwnProperty.call(GLYPHS, name) ? GLYPHS[name] : undefined;
    if (!body) {
    unknown.push(name);
    continue;
    }
    const size = Number(target.getAttribute('data-icon-size')) || ICON_SIZE;
    const key = name + ' ' + size;
    const last = filled.get(target);
    const place = target.getAttribute('data-icon-place');
    if (place === 'start' || place === 'end') {
    const kept = last && last.svg.parentNode === target ? last.svg : null;
    if (kept && last.key === key) continue;
    const svg = iconElement(body, size, undefined, doc);
    if (kept) kept.replaceWith(svg);
    else if (place === 'start') target.prepend(svg);
    else target.append(svg);
    filled.set(target, { key, svg });
    drawn += 1;
    continue;
    }
    if (last && last.key === key && target.childNodes.length === 1 && target.firstChild === last.svg) continue;
    const svg = iconElement(body, size, undefined, doc);
    target.replaceChildren(svg);
    filled.set(target, { key, svg });
    drawn += 1;
    }
    if (unknown.length) throw new Error('Unknown icon: ' + unknown.join(', '));
    return drawn;
    }

    return Object.freeze({
      close: close,
      moreVertical: moreVertical,
      check: check,
      checkCircle: checkCircle,
      alertCircle: alertCircle,
      info: info,
      moon: moon,
      laptop: laptop,
      monitor: monitor,
      smartphone: smartphone,
      tablet: tablet,
      ICON_SIZE: ICON_SIZE,
      icon: icon,
      iconElement: iconElement,
      fill: fill
    });
  });

  add('position', ['round', 'pxOf', 'computePlacement', 'viewportBounds', 'clippedBounds', 'fixedOrigin', 'dropProbe', 'place', 'supportsAnchoring', 'claimAnchor', 'releaseAnchor', 'anchorPopup'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const viewOf = (element) => element.ownerDocument?.defaultView ?? globalThis;
    const OWNED = Symbol.for('ds.owned');
    function own(element, kind, name) {
    if (!element || typeof element !== 'object') return;
    const record = element[OWNED] ?? (element[OWNED] = { attrs: new Map(), classes: new Map(), props: new Map() });
    record[kind].set(name, (record[kind].get(name) ?? 0) + 1);
    }
    function disown(element, kind, name) {
    const map = element?.[OWNED]?.[kind];
    const count = map?.get(name) ?? 0;
    if (count > 1) map.set(name, count - 1);
    else map?.delete(name);
    }
    function round(value) {
    return Math.round(value * 100) / 100;
    }
    function pxOf(element, token, fallback) {
    const value = parseFloat(viewOf(element).getComputedStyle?.(element).getPropertyValue(token) ?? '');
    return Number.isFinite(value) ? value : fallback;
    }
    function computePlacement(rect, size, bounds, options = {}) {
    const wanted = options.side ?? 'bottom';
    const offset = options.offset ?? 0;
    const padding = options.padding ?? 0;
    const rtl = options.rtl === true;
    const flip = options.flip ?? 'room';
    const vertical = wanted === 'bottom' || wanted === 'top';
    const far = wanted === 'bottom' || (wanted === 'end' && !rtl) || (wanted === 'start' && rtl);
    const [from, to, low, high, extent] = vertical
    ? [rect.top, rect.bottom, bounds.top, bounds.bottom, size.height]
    : [rect.left, rect.right, bounds.left, bounds.right, size.width];
    const towardsFar = high - padding - to - offset;
    const towardsNear = from - offset - low - padding;
    const here = far ? towardsFar : towardsNear;
    const there = far ? towardsNear : towardsFar;
    const flipped = extent > here && ((flip === 'room' && there > here) || (flip === 'fits' && extent <= there));
    const goesFar = flipped ? !far : far;
    const room = Math.max(0, flipped ? there : here);
    const length = options.size === false ? extent : Math.min(extent, room);
    const main = goesFar ? to + offset : from - offset - length;
    const [crossFrom, crossTo, crossLow, crossHigh, crossExtent, inline] = vertical
    ? [rect.left, rect.right, bounds.left, bounds.right, size.width, true]
    : [rect.top, rect.bottom, bounds.top, bounds.bottom, size.height, false];
    const align = options.align ?? 'start';
    const reversed = inline && rtl;
    const startEdge = reversed ? crossTo - crossExtent : crossFrom;
    const endEdge = reversed ? crossFrom : crossTo - crossExtent;
    const fits = (at) => at >= crossLow + padding && at + crossExtent <= crossHigh - padding;
    let cross = (crossFrom + crossTo) / 2 - crossExtent / 2;
    if (align !== 'center') {
    const [first, second] = align === 'start' ? [startEdge, endEdge] : [endEdge, startEdge];
    cross = options.crossFlip && !fits(first) && fits(second) ? second : first;
    }
    if (options.shift !== false) cross = Math.max(crossLow + padding, Math.min(crossHigh - crossExtent - padding, cross));
    const arrowPadding = options.arrowPadding ?? 0;
    const arrow = Math.max(arrowPadding, Math.min(crossExtent - arrowPadding, (crossFrom + crossTo) / 2 - cross));
    const side = vertical ? (goesFar ? 'bottom' : 'top') : (goesFar === !rtl ? 'end' : 'start');
    return vertical
    ? { x: cross, y: main, side, flipped, room, length, arrow }
    : { x: main, y: cross, side, flipped, room, length, arrow };
    }
    function viewportBounds(element) {
    const doc = element.ownerDocument;
    const view = viewOf(element);
    return { left: 0, top: 0, right: doc.documentElement.clientWidth || view.innerWidth, bottom: doc.documentElement.clientHeight || view.innerHeight };
    }
    function clippedBounds(element) {
    const doc = element.ownerDocument;
    const view = viewOf(element);
    const bounds = viewportBounds(element);
    for (let node = element.parentElement; node && node !== doc.body && node !== doc.documentElement; node = node.parentElement) {
    if (view.getComputedStyle?.(node).overflowY === 'visible') continue;
    const box = node.getBoundingClientRect();
    bounds.top = Math.max(bounds.top, box.top);
    bounds.bottom = Math.min(bounds.bottom, box.bottom);
    }
    return bounds;
    }
    const probes = new WeakMap();
    function fixedOrigin(element) {
    const parent = element.parentNode;
    if (!parent) return { left: 0, top: 0 };
    let probe = probes.get(element);
    if (!probe) {
    probe = element.ownerDocument.createElement('div');
    probe.setAttribute('data-ds-keep', '');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;margin:0;border:0;padding:0;transform:none;translate:none;scale:none;rotate:none;animation:none;transition:none;visibility:hidden;pointer-events:none';
    probes.set(element, probe);
    }
    if (probe.parentNode !== parent || probe.nextSibling !== element) parent.insertBefore(probe, element);
    const { left, top } = probe.getBoundingClientRect();
    return { left, top };
    }
    function dropProbe(element) {
    probes.get(element)?.remove();
    probes.delete(element);
    }
    const widthCapped = new WeakSet();
    function place(element, anchor, options = {}) {
    if (!anchor || typeof anchor.getBoundingClientRect !== 'function') return null;
    const view = viewOf(element);
    const style = element.style;
    const rect = anchor.getBoundingClientRect();
    const capped = options.size !== false;
    if (capped) {
    style.removeProperty('max-height');
    if (widthCapped.delete(element)) style.removeProperty('max-width');
    }
    const size = { width: element.offsetWidth, height: element.offsetHeight };
    const bounds = options.bounds ?? viewportBounds(element);
    const result = computePlacement(rect, size, bounds, { ...options, rtl: view.getComputedStyle?.(anchor).direction === 'rtl' });
    if (capped) {
    const inline = result.side === 'start' || result.side === 'end';
    if ((inline ? size.width : size.height) > result.room) {
    style.setProperty(inline ? 'max-width' : 'max-height', `${round(result.room)}px`);
    if (inline) widthCapped.add(element);
    }
    }
    if (options.x || options.y) {
    const origin = fixedOrigin(element);
    if (options.x) style.setProperty(options.x, `${round(result.x - origin.left)}px`);
    if (options.y) style.setProperty(options.y, `${round(result.y - origin.top)}px`);
    }
    if (result.side === 'bottom') element.removeAttribute('data-placement');
    else element.setAttribute('data-placement', result.side);
    return result;
    }
    function supportsAnchoring(view) {
    const proto = view.HTMLElement?.prototype ?? {};
    return typeof proto.showPopover === 'function' && typeof view.CSS?.supports === 'function'
    && view.CSS.supports('position-area: block-end') && 'anchorName' in view.document.documentElement.style;
    }
    const anchorClaims = new WeakMap();
    function claimAnchor(element, nextName) {
    const held = anchorClaims.get(element);
    if (held) {
    held.count += 1;
    return { name: held.name, mine: true };
    }
    const css = viewOf(element).getComputedStyle(element).getPropertyValue('anchor-name').trim();
    if (css && css !== 'none') return { name: css.split(',')[0].trim(), mine: false };
    const name = nextName();
    (element).style.setProperty('anchor-name', name);
    own(element, 'props', 'anchor-name');
    anchorClaims.set(element, { name, count: 1 });
    return { name, mine: true };
    }
    function releaseAnchor(element) {
    const held = element ? anchorClaims.get(element) : null;
    if (!held) return;
    held.count -= 1;
    if (held.count > 0) return;
    anchorClaims.delete(element);
    (element).style.removeProperty('anchor-name');
    disown(element, 'props', 'anchor-name');
    }
    function anchorPopup(element, anchor, options) {
    element.setAttribute('popover', 'manual');
    element.setAttribute('data-anchored', '');
    const { name, mine } = claimAnchor(anchor, options.nextName);
    const style = element.style;
    style.setProperty('position-anchor', name);
    try {
    element.showPopover();
    } catch {
    }
    style.setProperty('max-height', 'none');
    const height = element.offsetHeight;
    style.removeProperty('max-height');
    const offset = options.offset ?? 0;
    const { side } = computePlacement(anchor.getBoundingClientRect(), { width: 0, height }, viewportBounds(element), { offset, padding: offset });
    if (side === 'top') element.setAttribute('data-placement', 'top');
    else element.removeAttribute('data-placement');
    return mine;
    }

    return Object.freeze({
      round: round,
      pxOf: pxOf,
      computePlacement: computePlacement,
      viewportBounds: viewportBounds,
      clippedBounds: clippedBounds,
      fixedOrigin: fixedOrigin,
      dropProbe: dropProbe,
      place: place,
      supportsAnchoring: supportsAnchoring,
      claimAnchor: claimAnchor,
      releaseAnchor: releaseAnchor,
      anchorPopup: anchorPopup
    });
  });

  add('overlay', ['TOAST_MS', 'TOAST_MAX_MS', 'TOAST_LIMIT', 'TOOLTIP_DELAY_MS', 'TOOLTIP_SKIP_MS', 'TOOLTIP_HIDE_MS', 'DISMISS_DELAY_MS', 'DRAWER_QUERY', 'FOCUSABLE', 'canFocus', 'holdInert', 'lockScroll', 'unlockScroll', 'typeAhead', 'open', 'close', 'topmost', 'layerAt', 'savebar', 'confirm', 'alert', 'prompt', 'toastRegion', 'announce', 'toast', 'closeToasts', 'tooltips', 'internals'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, emit = DS.core.emit, runtime = DS.core.runtime;
    const motionDuration = DS.motion.motionDuration, originFrom = DS.motion.originFrom, settled = DS.motion.settled, transition = DS.motion.transition;
    const scrollEdges = DS.dom.scrollEdges, watchScrolled = DS.dom.watchScrolled;
    const anchorPopup = DS.position.anchorPopup, clippedBounds = DS.position.clippedBounds, dropProbe = DS.position.dropProbe, place = DS.position.place, pxOf = DS.position.pxOf, releaseAnchor = DS.position.releaseAnchor, round = DS.position.round, supportsAnchoring = DS.position.supportsAnchoring;
    const TOAST_MS = 4000;
    const TOAST_MAX_MS = 10000;
    const TOAST_LIMIT = 3;
    const TOOLTIP_DELAY_MS = 500;
    const TOOLTIP_SKIP_MS = 300;
    const TOOLTIP_HIDE_MS = 100;
    const DISMISS_DELAY_MS = 300;
    const DRAWER_QUERY = '(max-width: 900px)';
    const FOCUSABLE = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]';
    const LANDMARK = '.ds-view[tabindex="-1"], main[tabindex="-1"], [role="main"][tabindex="-1"]';
    const MODAL = new Set(['dialog', 'sheet', 'drawer']);
    const overlays = new WeakMap();
    const stack = ([]);
    function activeIn(node) {
    const root = node?.getRootNode?.();
    return (root?.nodeType === 11 ? root.activeElement : null) ?? node?.ownerDocument?.activeElement ?? null;
    }
    function inside(node, event) {
    if (!node) return false;
    const path = event.composedPath?.();
    return path?.length ? path.includes(node) : node.contains( (event.target));
    }
    const SHARED = Symbol.for('ds.overlay');
    const sharedRecords = runtime.state('overlay', () => new WeakMap());
    function sharedOf(doc) {
    let record = sharedRecords.get(doc);
    if (!record) {
    record = doc[SHARED] ?? {};
    sharedRecords.set(doc, record);
    doc[SHARED] = record;
    }
    record.order ??= [];
    record.lock ??= { count: 0, saved: null };
    record.seq ??= 0;
    record.tipRoots ??= new WeakMap();
    record.inertHolds ??= new WeakMap();
    return record;
    }
    function enterOrder(element) {
    const order = sharedOf(element.ownerDocument).order;
    leaveOrder(element);
    order.push({
    element,
    open: () => element.isConnected && overlays.get(element)?.phase === 'open',
    opener: () => overlays.get(element)?.opener ?? null,
    escape(event) {
    if (containedDialog(element) && !inside(containerOf(element), event)) return undefined;
    if (!escapeReaches(element, event)) return false;
    event.preventDefault();
    closeFrom(element, 'escape');
    return true;
    },
    });
    }
    const NON_MODAL = '.ds-dialog__box--modeless, .ds-sheet__panel--push, .ds-sheet__panel--inspector';
    function escapeReaches(element, event) {
    if (!element.matches?.(NON_MODAL)) return true;
    const target = (event.composedPath?.()[0] ?? event.target);
    const doc = element.ownerDocument;
    if (!target || target === doc || target === doc.body || target === doc.documentElement) return true;
    const docked = element.matches('.ds-sheet__panel--push, .ds-sheet__panel--inspector') ? element.closest('.ds-sheet__layout') : null;
    return inside(docked ?? element, event) || inside(overlays.get(element)?.opener ?? null, event);
    }
    function leaveOrder(element) {
    const order = element.ownerDocument?.[SHARED]?.order;
    const index = order ? order.findIndex((entry) => entry.element === element) : -1;
    if (index >= 0) order.splice(index, 1);
    }
    const managedInert = (new Set());
    const tooltipControllers = new Set();
    const neverInert = new WeakSet();
    const shownSavebars = new Set();
    const parts = {};
    const pageParts = runtime.state('overlay-parts', () => ({}));
    function partFor(name, fn) {
    const found = parts[name] ?? pageParts[name];
    if (found) return found;
    throw new Error(`Z-Dash: DS.overlay.${fn}() needs the ${name} module: import js/${name}.js next to js/overlay.js, or keep ${name} in the bundle.`);
    }
    const partsWarned = new Set();
    function warnMissingPart(element, kind) {
    if (parts[kind] || partsWarned.has(kind)) return;
    partsWarned.add(kind);
    viewOf(element).console?.warn(`Z-Dash: DS.overlay.open() on a ${kind} needs the ${kind} module: import js/${kind}.js next to js/overlay.js, or keep ${kind} in the bundle.`);
    }
    const listening = new WeakSet();
    const wired = new WeakSet();
    const watchedDrawers = new WeakSet();
    let warned = false;
    const OWNED = Symbol.for('ds.owned');
    function own(element, kind, name) {
    if (!element || typeof element !== 'object') return;
    const record = element[OWNED] ?? (element[OWNED] = { attrs: new Map(), classes: new Map(), props: new Map() });
    record[kind].set(name, (record[kind].get(name) ?? 0) + 1);
    }
    function disown(element, kind, name) {
    const map = element?.[OWNED]?.[kind];
    const count = map?.get(name) ?? 0;
    if (count > 1) map.set(name, count - 1);
    else map?.delete(name);
    }
    const PANEL_STATE = {
    attrs: ['data-state', 'hidden', 'open', 'popover', 'data-anchored', 'data-placement'],
    classes: ['ds-dialog--closing', 'ds-sheet--closing', 'ds-dialog--nested', 'ds-dialog--hidden', 'ds-sheet--hidden'],
    props: ['--ds-menu-x', '--ds-menu-y', 'max-height', 'position-anchor'],
    };
    function claim(state, node, kind, names) {
    if (!node) return;
    for (const name of names) {
    own(node, kind, name);
    state.claims.push([node, kind, name]);
    }
    }
    function releaseClaims(state) {
    for (const [node, kind, name] of state.claims) disown(node, kind, name);
    state.claims = [];
    }
    function stateOf(element) {
    let state = overlays.get(element);
    if (!state) {
    state = { gen: 0, phase: 'closed', kind: kindOf(element), opener: null, expander: null, inerted: [], locked: false, lockedDoc: null, hiddenClass: '', opening: null, closing: null, anchor: null, home: null, app: null, container: null, claims: [], openerId: '', openerRoot: null, returnTo: null, shownAt: 0, pressed: null, cancelled: false, edges: null };
    overlays.set(element, state);
    }
    return state;
    }
    function kindOf(element) {
    if (element.matches('.ds-drawer')) return 'drawer';
    if (element.matches('.ds-dialog')) return 'dialog';
    if (element.matches('.ds-sheet')) return 'sheet';
    if (element.matches('.ds-menu')) return 'menu';
    if (element.matches('.ds-combo__popup')) return 'combo';
    return 'popup';
    }
    function boxOf(element, kind) {
    if (kind === 'dialog') return element.querySelector('.ds-dialog__box') ?? element;
    if (kind === 'sheet') return element.querySelector('.ds-sheet__panel') ?? element;
    return element;
    }
    const isNative = (element) => element.tagName === 'DIALOG' && typeof element.showModal === 'function';
    const viewOf = (element) => element.ownerDocument?.defaultView ?? globalThis;
    function flushStyle(element) {
    const view = viewOf(element);
    if (typeof view.getComputedStyle === 'function') void view.getComputedStyle(element).opacity;
    }
    function canFocus(node) {
    if (!node || node.isConnected === false || typeof node.focus !== 'function') return false;
    if (node.disabled || node.closest?.('[inert], [hidden]')) return false;
    return typeof node.getClientRects !== 'function' || node.getClientRects().length > 0;
    }
    function firstFocusable(root) {
    for (const node of root.querySelectorAll(FOCUSABLE)) {
    if (node.getAttribute('tabindex') === '-1' || node.getAttribute('role') === 'separator') continue;
    if (canFocus(node)) return node;
    }
    return null;
    }
    function returnTarget(element, state) {
    const takes = (node) => canFocus(node) && (typeof node.matches !== 'function' || node.matches(FOCUSABLE));
    let opener = state.opener;
    for (let depth = 0; opener && depth < 4; depth += 1) {
    if (takes(opener) && !element.contains(opener)) return opener;
    const host = [...stack, ...hostsOf(opener)].find((node) => node !== element && node.contains(opener));
    opener = host ? overlays.get(host)?.opener ?? null : null;
    }
    const outside = (node) => takes(node) && !element.contains(node);
    if (typeof state.returnTo === 'function') {
    try {
    const target = state.returnTo();
    if (outside(target)) return target;
    } catch (error) {
    report(element, error);
    }
    }
    const twin = state.openerId ? state.openerRoot?.getElementById?.(state.openerId) : null;
    if (twin && twin !== state.opener && outside(twin)) return twin;
    const doc = element.ownerDocument;
    const near = element.parentElement?.closest('[tabindex="-1"]');
    return [near, doc.querySelector(LANDMARK)].find(outside) ?? null;
    }
    function report(element, error) {
    const view = viewOf(element);
    if (typeof view.reportError === 'function') view.reportError(error);
    else view.console?.error(error);
    }
    function defaultOpener(element) {
    const doc = element.ownerDocument;
    const active = activeIn(element);
    if (active && active !== doc.body && !element.contains(active)) return active;
    if (active && active !== doc.body) return null;
    const event = (viewOf(element)).event;
    const origin = event?.composedPath?.()[0] ?? event?.target;
    const control = origin?.closest?.(OPENER_CONTROL);
    return control && canFocus(control) && !element.contains(control) ? control : null;
    }
    const OPENER_CONTROL = 'button, a[href], input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"])';
    function hostsOf(node) {
    const hosts = [];
    for (let el = node?.parentElement; el; el = el.parentElement) if (overlays.has(el)) hosts.push(el);
    return hosts;
    }
    const TEXT_ENTRY = 'input:not([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"], [type="image"]), textarea, select, [contenteditable]:not([contenteditable="false"])';
    const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock']);
    const INPUT = Symbol.for('ds.input');
    function watchModality(doc) {
    if (typeof doc?.addEventListener !== 'function' || doc[INPUT]) return;
    const record = (doc[INPUT] = { last: '' });
    for (const type of ['pointerdown', 'mousedown']) doc.addEventListener(type, () => { record.last = 'pointer'; }, { capture: true, passive: true });
    doc.addEventListener('keydown', ( event) => {
    if (!MODIFIER_KEYS.has(event.key)) record.last = 'key';
    }, true);
    }
    function keepFocusVisibility(element, run) {
    const before = activeIn(element);
    const body = element.ownerDocument.body;
    const was = Boolean(before) && before !== body && before.matches(':focus-visible');
    const event = (viewOf(element)).event;
    const type = event?.type ?? '';
    const key = /^key/.test(type) || (type === 'click' && event.detail === 0);
    const press = !key && /^(pointer|mouse|touch|click$)/.test(type);
    const pointer = press || (!key && element.ownerDocument[INPUT]?.last === 'pointer');
    run();
    const now = activeIn(element);
    if (was || !pointer || !now || now === before || now === body || now.matches(TEXT_ENTRY) || !now.matches(':focus-visible')) return;
    now.blur();
    now.focus({ preventScroll: true, focusVisible: false });
    }
    function focusInto(element, state, box) {
    const autofocus = element.querySelector('[autofocus]');
    if (canFocus(autofocus)) {
    autofocus.focus({ preventScroll: true });
    return;
    }
    if (state.kind === 'combo') return;
    if (state.kind === 'menu') {
    parts.menu?.focusInto(element);
    return;
    }
    if (state.kind === 'drawer') {
    const current = element.querySelector('[aria-current="page"]');
    if (canFocus(current)) {
    current.focus({ preventScroll: true });
    return;
    }
    }
    if (state.kind === 'drawer' && element.hasAttribute('tabindex')) {
    element.focus({ preventScroll: true });
    return;
    }
    if (state.kind === 'popup') return;
    const target = firstFocusable(box);
    if (target) target.focus({ preventScroll: true });
    else {
    if (!box.hasAttribute('tabindex')) box.setAttribute('tabindex', '-1');
    box.focus({ preventScroll: true });
    }
    }
    function inertOutside(element, stop = element.ownerDocument.body) {
    const taken = [];
    const body = element.ownerDocument.body;
    const holds = sharedOf(element.ownerDocument).inertHolds;
    for (let node = element; node && node !== stop && node !== body;) {
    const parent = node.parentNode;
    if (!parent || parent.nodeType === 9) break;
    for (const sibling of (parent).children) {
    if (sibling === node || sibling.matches('.ds-scrim, .ds-toasts') || neverInert.has(sibling)) continue;
    if (sibling.inert && !managedInert.has(sibling) && !holds.has(sibling)) continue;
    taken.push(sibling);
    }
    node = parent.nodeType === 11 ? (parent).host : (parent);
    }
    return taken;
    }
    function composedContains(node, other) {
    for (let at = other; at; at = at.parentNode ?? (at).host ?? null) {
    if (at === node) return true;
    }
    return false;
    }
    function refreshTraps(targets) {
    let grew = false;
    for (const element of stack) {
    const state = overlays.get(element);
    if (!state?.inerted.length || state.phase !== 'open' || !element.isConnected) continue;
    if (!targets.some((target) => composedContains(target, element))) continue;
    const stop = containedDialog(element) ? containerOf(element) : undefined;
    const known = new Set(state.inerted);
    for (const node of inertOutside(element, stop)) {
    if (known.has(node)) continue;
    state.inerted.push(node);
    grew = true;
    }
    }
    if (grew) syncInert();
    }
    function syncInert() {
    const wanted = new Set();
    stack.forEach((element, index) => {
    const above = stack.slice(index + 1);
    for (const node of overlays.get(element)?.inerted ?? []) {
    if (node.isConnected && !above.some((other) => composedContains(node, other))) wanted.add(node);
    }
    });
    const closingBoxes = new Set(stack.filter((element) => overlays.get(element)?.phase === 'closing')
    .map((element) => boxOf(element, overlays.get(element)?.kind ?? '')));
    for (const node of [...managedInert]) {
    if (wanted.has(node)) continue;
    managedInert.delete(node);
    disown(node, 'attrs', 'inert');
    if (!closingBoxes.has(node) && !sharedOf(node.ownerDocument).inertHolds.has(node)) node.inert = false;
    }
    for (const node of wanted) {
    if (!managedInert.has(node)) own(node, 'attrs', 'inert');
    managedInert.add(node);
    node.inert = true;
    }
    }
    const containedDialog = (element) => element.matches('.ds-dialog--contained');
    function containerOf(element) {
    const doc = element.ownerDocument;
    const view = viewOf(element);
    for (let node = element.parentElement; node && node !== doc.body && node !== doc.documentElement; node = node.parentElement) {
    if ((view.getComputedStyle?.(node).position ?? 'static') !== 'static') return node;
    }
    return element.closest('.ds-theme') ?? doc.body;
    }
    function restoreInert(state) {
    state.inerted = [];
    syncInert();
    }
    function holdInert(elements) {
    const nodes = [...new Set(elements)].filter((node) => node?.ownerDocument);
    for (const node of nodes) {
    const holds = sharedOf(node.ownerDocument).inertHolds;
    const held = holds.get(node);
    if (held) {
    held.count += 1;
    continue;
    }
    holds.set(node, { count: 1, pageOwn: node.inert === true && !managedInert.has(node) });
    own(node, 'attrs', 'inert');
    node.inert = true;
    }
    let done = false;
    return {
    destroy() {
    if (done) return;
    done = true;
    for (const node of nodes) {
    const holds = sharedOf(node.ownerDocument).inertHolds;
    const held = holds.get(node);
    held.count -= 1;
    if (held.count) continue;
    holds.delete(node);
    disown(node, 'attrs', 'inert');
    if (!held.pageOwn && !managedInert.has(node)) node.inert = false;
    }
    },
    };
    }
    function supportsGutter(view) {
    return typeof view.CSS?.supports === 'function' && view.CSS.supports('scrollbar-gutter: stable');
    }
    function lockScroll(doc = globalThis.document) {
    if (!doc?.body) return;
    const lock = sharedOf(doc).lock;
    lock.count += 1;
    if (lock.count !== 1) return;
    const root = doc.documentElement;
    const body = doc.body;
    const view = doc.defaultView ?? globalThis;
    const before = (view.innerWidth || 0) - (root.clientWidth || 0);
    lock.saved = { gutter: root.style.scrollbarGutter ?? '', padding: body.style.paddingRight ?? '' };
    body.classList.add('ds-no-scroll');
    const gap = before - ((view.innerWidth || 0) - (root.clientWidth || 0));
    if (!(before > 0) || !(gap > 0)) return;
    if (supportsGutter(view)) root.style.scrollbarGutter = 'stable';
    else {
    const padding = parseFloat(view.getComputedStyle?.(body).paddingRight ?? '') || 0;
    body.style.paddingRight = `${padding + gap}px`;
    }
    }
    function unlockScroll(doc = globalThis.document) {
    const lock = doc?.body ? doc[SHARED]?.lock : null;
    if (!lock || lock.count === 0) return;
    lock.count -= 1;
    if (lock.count) return;
    doc.body.classList.remove('ds-no-scroll');
    if (lock.saved) {
    doc.documentElement.style.scrollbarGutter = lock.saved.gutter;
    doc.body.style.paddingRight = lock.saved.padding;
    }
    lock.saved = null;
    }
    function topOpen() {
    pruneDetached();
    for (let i = stack.length - 1; i >= 0; i -= 1) {
    if (overlays.get(stack[i])?.phase === 'open') return stack[i];
    }
    return null;
    }
    function listen(doc) {
    if (listening.has(doc)) return;
    listening.add(doc);
    watchModality(doc);
    doc.addEventListener('keydown', ( event) => {
    if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) return;
    for (const tip of tooltipControllers) {
    if (!tip.escape()) continue;
    event.preventDefault();
    return;
    }
    pruneDetached();
    const order = doc[SHARED]?.order ?? [];
    for (let i = order.length - 1; i >= 0; i -= 1) {
    if (!order[i].open()) continue;
    if (clearSearch(order[i].element, event)) return;
    if (order[i].escape(event) === false) continue;
    return;
    }
    });
    doc.addEventListener('pointerdown', ( event) => {
    pruneDetached();
    for (const element of [...stack].reverse()) {
    const state = overlays.get(element);
    if (state?.kind !== 'menu' || state.phase !== 'open') continue;
    if (inside(element, event) || inside(state.opener, event)) continue;
    closeFrom(element, 'outside');
    }
    }, true);
    }
    function clearSearch(layer, event) {
    const target = (event.composedPath?.()[0] ?? event.target);
    if (!target || target.localName !== 'input' || target.type !== 'search' || !target.value) return false;
    if (!composedContains(layer, target) || target.readOnly || target.disabled) return false;
    event.preventDefault();
    target.value = '';
    const view = viewOf(target);
    target.dispatchEvent(new view.Event('input', { bubbles: true, composed: true }));
    return true;
    }
    const CLOSERS = '[data-ds-close=""]';
    const USER_CLOSE = new Set(['escape', 'backdrop', 'close']);
    function dismissable(element, state, part, event) {
    if (event.detail === 0) return true;
    if (event.detail > 1 || !state.pressed || !composedContains(part, state.pressed)) return false;
    return clock() - state.shownAt >= motionDuration(element, '--ds-delay-dismiss');
    }
    function wire(element, state) {
    if (wired.has(element)) return;
    wired.add(element);
    const holdFocus = ( event) => {
    const phase = overlays.get(element)?.phase;
    if (!phase || phase === 'closed') return;
    const target = (event.target);
    if (phase === 'closing' || target.closest?.('.ds-dialog__backdrop, .ds-sheet__backdrop, .ds-scrim')) event.preventDefault();
    };
    element.addEventListener('mousedown', holdFocus, true);
    const pressAt = ( event) => {
    const own = overlays.get(element);
    if (own) own.pressed = (event.composedPath?.()[0] ?? event.target);
    };
    element.addEventListener('pointerdown', pressAt, true);
    element.addEventListener('click', ( event) => {
    const target = (event.target);
    const closer = target.closest?.(CLOSERS);
    if (!closer || !element.contains(closer)) return;
    if (hostsOf(closer)[0] !== element && closer !== element) return;
    const own = overlays.get(element);
    if (own?.phase !== 'open') return;
    if (event.detail > 1) return;
    const backdrop = closer.matches('.ds-dialog__backdrop, .ds-sheet__backdrop');
    if (backdrop && !dismissable(element, own, closer, event)) return;
    closeFrom(element, backdrop ? 'backdrop' : 'close');
    });
    if (state.kind === 'menu') parts.menu?.wire(element);
    if (state.kind === 'dialog') parts.dialog?.wire(element);
    if (state.kind === 'drawer') {
    const scrim = element.parentElement?.querySelector(':scope > .ds-scrim');
    scrim?.addEventListener('click', ( event) => {
    const own = overlays.get(element);
    if (own?.phase === 'open' && dismissable(element, own, scrim, event)) closeFrom(element, 'backdrop');
    });
    scrim?.addEventListener('mousedown', holdFocus, true);
    scrim?.addEventListener('pointerdown', pressAt, true);
    }
    if (isNative(element)) {
    element.addEventListener('cancel', (event) => {
    const own = overlays.get(element);
    if (own && !event.cancelable) own.cancelled = true;
    event.preventDefault();
    if (own?.phase === 'open') closeFrom(element, 'escape');
    });
    element.addEventListener('close', () => {
    const own = overlays.get(element);
    if (own?.phase !== 'open' || element.open) return;
    const reason = own.cancelled ? 'escape' : 'api';
    own.cancelled = false;
    closeFrom(element, 'native', reason);
    });
    }
    }
    function watchBodies(element) {
    for (const body of element.querySelectorAll?.('.ds-dialog__body, .ds-sheet__body') ?? []) {
    if (body.closest('.ds-dialog, .ds-sheet') !== element) continue;
    const handle = watchScrolled(body);
    if (!body.querySelector(':scope > [data-ds-sentinel]')) handle.update();
    }
    }
    function arrowTarget(items, event) {
    if (!items.length || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return null;
    const current = items.indexOf( (event.target)?.closest?.('.ds-menu__item'));
    if (event.key === 'Home') return items[0];
    if (event.key === 'End') return items.at(-1);
    if (event.key === 'ArrowDown') return items[(current + 1) % items.length];
    return items[current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length];
    }
    const menuItemLabel = (item) => (item.querySelector('.ds-menu__label') ?? item).textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    function typeAhead(items, current, typed, label = menuItemLabel) {
    const repeated = typed.length > 1 && [...typed].every((char) => char === typed[0]);
    const start = items.indexOf(current);
    const from = typed.length === 1 || repeated ? start + 1 : Math.max(0, start);
    for (const text of repeated ? [typed, typed[0]] : [typed]) {
    for (let step = 0; step < items.length; step += 1) {
    const item = items[(from + step) % items.length];
    if (label(item).startsWith(text)) return item;
    }
    }
    return null;
    }
    function popupAnchoring(view, kind) {
    if (!supportsAnchoring(view)) return false;
    return kind !== 'combo' || view.CSS.supports('width: anchor-size(width)');
    }
    function popupAnchorOf(element, state) {
    const anchor = state.kind === 'combo' ? element.closest('.ds-combo') ?? state.opener : state.opener;
    return anchor && typeof anchor.getBoundingClientRect === 'function' ? anchor : null;
    }
    function placePopup(element, state) {
    const anchor = popupAnchorOf(element, state);
    if (!anchor) return null;
    const view = viewOf(element);
    if (popupAnchoring(view, state.kind)) {
    releaseAnchor(state.anchor);
    state.anchor = null;
    const mine = anchorPopup( (element), anchor, { nextName: () => nextAnchorName(element.ownerDocument), offset: pxOf(element, '--ds-space-1', 4) });
    if (mine) state.anchor = (anchor);
    } else if (state.kind === 'menu') placeMenu(element, anchor);
    else placeList(element, anchor);
    return anchor;
    }
    function nextAnchorName(doc) {
    return `--ds-anchor-${sharedOf(doc).seq += 1}`;
    }
    function placeMenu(menu, anchor) {
    place(menu, anchor, { offset: pxOf(menu, '--ds-space-1', 4), padding: pxOf(menu, '--ds-space-2', 8), crossFlip: true, x: '--ds-menu-x', y: '--ds-menu-y' });
    }
    function placeList(list, anchor) {
    const gap = pxOf(list, '--ds-space-1', 4);
    place(list, anchor, { offset: gap, padding: gap, shift: false, bounds: clippedBounds(list) });
    }
    function releasePopup(element, state) {
    dropProbe(element);
    if (element.hasAttribute('popover')) {
    try {
    if (element.matches(':popover-open')) (element).hidePopover();
    } catch {
    }
    element.removeAttribute('popover');
    }
    element.removeAttribute('data-anchored');
    element.removeAttribute('data-placement');
    (element).style.removeProperty('position-anchor');
    (element).style.removeProperty('max-height');
    releaseAnchor(state.anchor);
    state.anchor = null;
    unwatchEdges(state);
    }
    function watchEdges(element, state) {
    const scroller = state.kind === 'combo' ? element.querySelector('.ds-combo__list') ?? element : element;
    if (state.edges?.scroller === scroller) {
    state.edges.handle.update();
    return;
    }
    unwatchEdges(state);
    if (scroller.hasAttribute('data-ds-edges')) return;
    state.edges = { scroller, handle: scrollEdges(scroller, { axis: 'block' }) };
    }
    function unwatchEdges(state) {
    state.edges?.handle.destroy();
    state.edges = null;
    }
    function nativeHostFor(element) {
    for (let i = stack.length - 1; i >= 0; i -= 1) {
    const other = stack[i];
    const state = overlays.get(other);
    if (other === element || state?.phase !== 'open' || !MODAL.has(state.kind) || !isNative(other) || !other.open) continue;
    return other.contains(element) ? null : other;
    }
    return null;
    }
    function adopt(element, state) {
    if (state.home || !['menu', 'popup', 'dialog', 'sheet'].includes(state.kind)) return;
    if (isNative(element) && element.open) return;
    const host = nativeHostFor(element);
    if (!host || !element.parentNode) return;
    state.home = { parent: element.parentNode, next: element.nextSibling, host, kept: keepAway(element) };
    host.append(element);
    }
    function keepAway(node) {
    if (!node || node.hasAttribute('data-ds-keep')) return false;
    node.setAttribute('data-ds-keep', '');
    return true;
    }
    function keepHome(node, kept) {
    if (kept) node?.removeAttribute('data-ds-keep');
    }
    function giveBack(element, state) {
    const home = state.home;
    state.home = null;
    if (home) keepHome(element, home.kept);
    if (!home || element.parentNode === home.parent) return;
    home.parent.insertBefore(element, home.next && home.next.parentNode === home.parent ? home.next : null);
    }
    function drawerQuery(drawer) {
    const view = viewOf(drawer);
    return typeof view.matchMedia === 'function' ? view.matchMedia(DRAWER_QUERY) : null;
    }
    const drawerCrossings = new WeakMap();
    function crossDrawer(drawer, query) {
    const view = viewOf(drawer);
    const run = (drawerCrossings.get(drawer) ?? 0) + 1;
    drawerCrossings.set(drawer, run);
    const frame = (callback) => (typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(callback) : setTimeout(callback));
    drawer.classList.add('ds-drawer--instant');
    if (!query.matches) {
    const state = overlays.get(drawer);
    if (state && state.phase !== 'closed') closeNow(drawer, state);
    }
    frame(() => frame(() => {
    if (drawerCrossings.get(drawer) === run) drawer.classList.remove('ds-drawer--instant');
    }));
    }
    const drawerWatches = new WeakMap();
    function watchDrawer(drawer, query) {
    if (!query || watchedDrawers.has(drawer)) return;
    watchedDrawers.add(drawer);
    const drawers = drawerWatchOf(viewOf(drawer), query);
    for (const ref of [...drawers]) if (!ref.deref()) drawers.delete(ref);
    drawers.add(new WeakRef(drawer));
    }
    function drawerWatchOf(view, query) {
    const known = drawerWatches.get(view);
    if (known) return known.drawers;
    const watch = { query, drawers: (new Set()) };
    drawerWatches.set(view, watch);
    const onChange = () => {
    for (const ref of [...watch.drawers]) {
    const drawer = ref.deref();
    if (!drawer) watch.drawers.delete(ref);
    else if (drawer.isConnected) crossDrawer(drawer, watch.query);
    }
    };
    query.addEventListener?.('change', onChange);
    return watch.drawers;
    }
    if (typeof globalThis.matchMedia === 'function' && typeof globalThis.document?.querySelectorAll === 'function') {
    const query = globalThis.matchMedia(DRAWER_QUERY);
    const onChange = () => {
    for (const drawer of globalThis.document.querySelectorAll('.ds-app > .ds-drawer')) {
    if (!watchedDrawers.has(drawer)) crossDrawer(drawer, query);
    }
    };
    query.addEventListener?.('change', onChange);
    }
    function closeNow(drawer, state) {
    const wasOpen = state.phase === 'open';
    state.gen += 1;
    state.closing = null;
    state.opening = null;
    state.phase = 'closed';
    (state.app ?? drawer.closest('.ds-app'))?.removeAttribute('data-drawer-open');
    state.expander?.setAttribute('aria-expanded', 'false');
    restoreInert(state);
    drawer.inert = false;
    finishClose(drawer, state);
    if (wasOpen) announceClose(drawer, 'breakpoint');
    }
    function finishClose(element, state) {
    const index = stack.indexOf(element);
    if (index >= 0) stack.splice(index, 1);
    leaveOrder(element);
    syncInert();
    if (state.locked) {
    state.locked = false;
    unlockScroll(state.lockedDoc ?? undefined);
    state.lockedDoc = null;
    }
    releaseClaims(state);
    state.app = null;
    unwatchRemovals(element.ownerDocument);
    }
    const removals = new WeakMap();
    function watchRemovals(doc) {
    let watch = removals.get(doc);
    if (!watch) {
    const view = doc.defaultView ?? globalThis;
    if (typeof view.MutationObserver !== 'function') return;
    watch = { observer: new view.MutationObserver(pruneDetached), on: false };
    removals.set(doc, watch);
    }
    if (watch.on || !doc.documentElement) return;
    watch.on = true;
    watch.observer.observe(doc.documentElement, { childList: true, subtree: true });
    }
    function unwatchRemovals(doc) {
    const watch = removals.get(doc);
    if (!watch?.on || stack.some((element) => element.ownerDocument === doc)) return;
    watch.on = false;
    watch.observer.disconnect();
    }
    function pruneDetached(records) {
    if (stack.some((element) => !element.isConnected)) dropDetached();
    const grown = records?.filter((record) => record.addedNodes.length).map((record) => record.target) ?? [];
    if (grown.length) refreshTraps(grown);
    }
    function dropDetached() {
    for (const element of stack.filter((item) => !item.isConnected).reverse()) {
    if (element.isConnected) continue;
    const state = overlays.get(element);
    if (!state) {
    stack.splice(stack.indexOf(element), 1);
    leaveOrder(element);
    continue;
    }
    const kind = state.kind;
    const wasOpen = state.phase === 'open';
    dropProbe(element);
    state.gen += 1;
    state.phase = 'closed';
    state.closing = null;
    state.opening = null;
    state.container = null;
    const home = state.home;
    state.home = null;
    state.inerted = [];
    state.expander?.setAttribute('aria-expanded', 'false');
    if (kind === 'drawer') (state.app ?? element.closest('.ds-app'))?.removeAttribute('data-drawer-open');
    else {
    if (isNative(element) && element.open) element.close();
    element.classList.remove('ds-dialog--closing', 'ds-sheet--closing');
    if (!isNative(element)) {
    if (state.hiddenClass) element.classList.add(state.hiddenClass);
    else (element).hidden = true;
    }
    if (kind === 'menu' || kind === 'combo') releasePopup(element, state);
    element.removeAttribute('data-state');
    }
    if (kind === 'dialog' || kind === 'sheet') parts.toast?.release(element);
    boxOf(element, kind).inert = false;
    element.classList.remove('ds-dialog--nested');
    if (home && home.host?.contains(element) && home.parent.isConnected) {
    state.home = home;
    giveBack(element, state);
    } else if (home) keepHome(element, home.kept);
    finishClose(element, state);
    if (wasOpen) announceClose(element, 'removed');
    }
    }
    function open(element, options = {}) {
    if (!element?.isConnected) return Promise.resolve();
    if (options.container) {
    const transform = containerOpen(element, options);
    if (transform) return transform;
    }
    return show(element, options, false);
    }
    const UNNAMED_IN_CONTAINER = '.ds-view, .ds-panel, .ds-drawer';
    function containerOpen(element, options) {
    const doc = element.ownerDocument;
    const state = stateOf(element);
    if (state.kind !== 'dialog' && state.kind !== 'sheet') return null;
    if (state.phase !== 'closed' || state.container) return state.container?.done ?? null;
    const viewTransitions = typeof doc.startViewTransition === 'function' && doc.documentElement.classList.contains('ds-theme');
    if (!viewTransitions) return null;
    const opener = options.opener ?? defaultOpener(element);
    if (!opener?.isConnected || typeof opener.getBoundingClientRect !== 'function') return null;
    const lifted = new Map();
    for (const part of [...doc.querySelectorAll(UNNAMED_IN_CONTAINER), ...element.querySelectorAll('.ds-sheet__body')]) {
    lifted.set(part, part.style.getPropertyValue('view-transition-name'));
    part.style.setProperty('view-transition-name', 'none');
    }
    const restore = () => {
    for (const [part, before] of lifted) {
    if (part.style.getPropertyValue('view-transition-name') !== 'none') continue;
    if (before) part.style.setProperty('view-transition-name', before);
    else part.style.removeProperty('view-transition-name');
    }
    };
    const pending = { done: (null) };
    state.container = pending;
    let entrance = Promise.resolve();
    const update = () => {
    const current = state.container === pending;
    if (current) state.container = null;
    if (!current || !element.isConnected) return null;
    const transform = doc.documentElement.getAttribute('data-ds-vt') === 'container';
    entrance = show(element, { ...options, opener }, transform);
    return transform ? boxOf(element, state.kind) : null;
    };
    pending.done = transition(update, { type: 'container', from: opener }).then(
    () => { restore(); return entrance; },
    (error) => { restore(); throw error; },
    );
    return pending.done;
    }
    function remember(state, options) {
    const opener = state.opener;
    state.openerId = typeof opener?.id === 'string' ? opener.id : '';
    state.openerRoot = state.openerId ? opener.getRootNode?.() ?? opener.ownerDocument : null;
    state.returnTo = typeof options.returnTo === 'function' ? options.returnTo : null;
    }
    function show(element, options, transform) {
    const doc = element.ownerDocument;
    const state = stateOf(element);
    state.container = null;
    const kind = state.kind;
    const box = boxOf(element, kind);
    const app = kind === 'drawer' ? element.closest('.ds-app') : null;
    if (kind === 'drawer') {
    const query = drawerQuery(element);
    watchDrawer(element, query);
    if (query && !query.matches) return Promise.resolve();
    }
    if (!warned && !element.closest('.ds-theme')) {
    warned = true;
    viewOf(element).console?.warn('Z-Dash: DS.overlay.open() on an element outside .ds-theme. Overlays must sit inside the .ds-theme element, or they get neither the tokens nor the motion.');
    }
    if (kind === 'menu' || kind === 'dialog') warnMissingPart(element, kind);
    for (const tip of tooltipControllers) tip.hide();
    if (state.phase === 'open') return state.opening ?? Promise.resolve();
    pruneDetached();
    listen(doc);
    wire(element, state);
    if (kind === 'dialog' || kind === 'sheet') watchBodies(element);
    let reopening = state.phase === 'closing';
    if (reopening && (kind === 'menu' || kind === 'combo' || kind === 'popup') && options.opener && options.opener !== state.opener) {
    if (kind !== 'popup') releasePopup(element, state);
    reopening = false;
    }
    const gen = ++state.gen;
    state.closing = null;
    state.phase = 'open';
    if (!reopening) {
    const focused = defaultOpener(element);
    const menuButton = app?.querySelector('.ds-topbar__menu') ?? null;
    state.opener = options.opener ?? (kind === 'drawer' ? menuButton ?? focused : focused);
    const expands = Boolean(state.opener?.hasAttribute?.('aria-expanded'));
    state.expander = kind === 'drawer' ? menuButton ?? state.opener : MODAL.has(kind) ? (expands ? state.opener : null) : state.opener;
    remember(state, options);
    releaseClaims(state);
    for (const key of (['attrs', 'classes', 'props'])) claim(state, element, key, PANEL_STATE[key]);
    claim(state, box, 'attrs', ['inert']);
    claim(state, state.expander, 'attrs', ['aria-expanded']);
    claim(state, app, 'attrs', ['data-drawer-open']);
    state.app = app;
    } else if (options.opener) {
    state.opener = options.opener;
    remember(state, options);
    }
    state.shownAt = clock();
    state.pressed = null;
    const contained = kind === 'dialog' && containedDialog(element);
    const index = stack.indexOf(element);
    if (index >= 0) stack.splice(index, 1);
    if (MODAL.has(kind)) {
    if (!state.locked && !contained) {
    state.locked = true;
    state.lockedDoc = doc;
    lockScroll(doc);
    }
    if (kind === 'dialog') {
    const nested = !contained && stack.some((other) => MODAL.has(overlays.get(other)?.kind ?? '') && overlays.get(other)?.phase === 'open' && !containedDialog(other));
    element.classList.toggle('ds-dialog--nested', nested);
    }
    }
    stack.push(element);
    enterOrder(element);
    watchRemovals(doc);
    if (!reopening) adopt(element, state);
    if (kind !== 'drawer' && !reopening) element.setAttribute('data-state', transform ? 'open' : 'closed');
    if (kind === 'drawer') {
    app?.setAttribute('data-drawer-open', '');
    element.inert = false;
    if (!state.inerted.length) state.inerted = inertOutside(element);
    } else if (isNative(element) && MODAL.has(kind)) {
    element.classList.remove('ds-dialog--closing', 'ds-sheet--closing');
    if (!element.open) keepFocusVisibility(element, () => element.showModal());
    parts.toast?.host(element, 'enter');
    } else {
    if ( (element).hidden) (element).hidden = false;
    for (const name of ['ds-dialog--hidden', 'ds-sheet--hidden']) {
    if (element.classList.contains(name)) {
    element.classList.remove(name);
    state.hiddenClass = name;
    }
    }
    if (kind === 'dialog' || kind === 'sheet') parts.toast?.host(element, 'enter');
    if (MODAL.has(kind) && !state.inerted.length) state.inerted = inertOutside(element, contained ? containerOf(element) : undefined);
    }
    syncInert();
    box.inert = false;
    if (kind !== 'drawer') {
    if (reopening) {
    element.setAttribute('data-state', 'open');
    if (kind === 'menu' || kind === 'combo') watchEdges(element, state);
    } else if (kind === 'menu' || kind === 'combo') {
    element.setAttribute('data-state', 'closed');
    const style = (element).style;
    style.setProperty('transition', 'none');
    style.setProperty('scale', 'none');
    const anchor = placePopup(element, state);
    const trigger = state.opener && typeof state.opener.getBoundingClientRect === 'function' ? state.opener : anchor;
    if (trigger) originFrom(trigger, element);
    style.removeProperty('scale');
    flushStyle(element);
    style.removeProperty('transition');
    element.setAttribute('data-state', 'open');
    watchEdges(element, state);
    } else if (!transform) {
    element.setAttribute('data-state', 'closed');
    flushStyle(box);
    if ((kind !== 'sheet') && state.opener && typeof state.opener.getBoundingClientRect === 'function') originFrom(state.opener, box);
    element.setAttribute('data-state', 'open');
    }
    }
    keepFocusVisibility(element, () => focusInto(element, state, box));
    state.expander?.setAttribute('aria-expanded', 'true');
    const entrance = settled(box, { transitions: true }).then(() => {
    if (state.gen === gen) state.opening = null;
    });
    state.opening = entrance;
    if (typeof viewOf(element).CustomEvent === 'function') emit(element, 'open', { opener: state.opener ?? null });
    return entrance;
    }
    function close(element, options = {}) {
    if (!element) return Promise.resolve();
    const pending = overlays.get(element);
    if (pending?.container) pending.container = null;
    if (element.matches('.ds-drawer')) watchDrawer(element, drawerQuery(element));
    return closeFrom(element, 'api', typeof options.reason === 'string' && options.reason ? options.reason : 'api');
    }
    function topmost(doc = globalThis.document) {
    if (!doc) return null;
    pruneDetached();
    const order = doc[SHARED]?.order ?? [];
    for (let i = order.length - 1; i >= 0; i -= 1) if (order[i].open()) return order[i].element;
    return null;
    }
    function layerOver(node) {
    const top = topmost(node.ownerDocument);
    if (!top || composedContains(top, node)) return null;
    if (containedDialog(top) && !composedContains(containerOf(top), node)) return null;
    return top;
    }
    function layerAt(node, doc = node?.ownerDocument ?? globalThis.document) {
    if (!doc) return null;
    pruneDetached();
    const order = doc[SHARED]?.order ?? [];
    for (let i = order.length - 1; i >= 0; i -= 1) {
    const { element } = order[i];
    if (!order[i].open()) continue;
    if (containedDialog(element) && !composedContains(containerOf(element), node)) continue;
    return element;
    }
    return null;
    }
    function opensOpenLayer(node) {
    pruneDetached();
    const order = node.ownerDocument?.[SHARED]?.order ?? [];
    return order.some((entry) => entry.open() && entry.opener?.() === node);
    }
    function announceClose(element, reason) {
    emit(element, 'close', { reason });
    }
    function closeFrom(element, cause, reason = cause) {
    const state = overlays.get(element);
    if (!state || state.phase === 'closed') return Promise.resolve();
    if (state.phase === 'closing') return state.closing ?? Promise.resolve();
    if (!element.isConnected) {
    dropDetached();
    return Promise.resolve();
    }
    const kind = state.kind;
    if (MODAL.has(kind) && USER_CLOSE.has(cause) && element.hasAttribute('data-ds-busy')) return Promise.resolve();
    const box = boxOf(element, kind);
    const doc = element.ownerDocument;
    if (MODAL.has(kind)) {
    for (const tip of tooltipControllers) tip.hide();
    for (const other of [...stack].reverse()) {
    const inner = overlays.get(other);
    if (other === element || inner?.phase !== 'open') continue;
    if (element.contains(other) || (!MODAL.has(inner.kind) && element.contains(inner.opener))) closeFrom(other, 'parent');
    }
    }
    const gen = ++state.gen;
    state.phase = 'closing';
    state.opening = null;
    const active = activeIn(element);
    const focusInside = Boolean(active) && (element.contains(active) || active === doc.body);
    if (kind === 'drawer') (state.app ?? element.closest('.ds-app'))?.removeAttribute('data-drawer-open');
    if (isNative(element) && MODAL.has(kind)) {
    element.classList.add(kind === 'sheet' ? 'ds-sheet--closing' : 'ds-dialog--closing');
    if (element.open) keepFocusVisibility(element, () => element.close());
    }
    restoreInert(state);
    state.expander?.setAttribute('aria-expanded', 'false');
    const returns = MODAL.has(kind) ? focusInside : cause !== 'outside' && element.contains(activeIn(element));
    if (returns) keepFocusVisibility(element, () => returnTarget(element, state)?.focus({ preventScroll: true }));
    if (kind === 'dialog' || kind === 'sheet') parts.toast?.host(element, 'exit');
    box.inert = true;
    if (kind !== 'drawer') element.setAttribute('data-state', 'closed');
    const exit = settled(box, { transitions: true }).then(() => {
    if (state.gen !== gen) return;
    state.phase = 'closed';
    state.closing = null;
    if (kind === 'dialog' || kind === 'sheet') parts.toast?.host(element, 'settle');
    if (kind !== 'drawer') {
    if (isNative(element) && MODAL.has(kind)) {
    element.classList.remove('ds-dialog--closing', 'ds-sheet--closing');
    flushStyle(element);
    } else if (state.hiddenClass) element.classList.add(state.hiddenClass);
    else (element).hidden = true;
    if (kind === 'menu' || kind === 'combo') releasePopup(element, state);
    element.removeAttribute('data-state');
    }
    box.inert = false;
    element.classList.remove('ds-dialog--nested');
    giveBack(element, state);
    finishClose(element, state);
    });
    state.closing = exit;
    announceClose(element, reason);
    return exit;
    }
    const normalText = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    const clock = () => (typeof globalThis.performance?.now === 'function' ? globalThis.performance.now() : Date.now());
    function timeScaleOf(element) {
    if (!element?.closest?.('.ds-theme')) return 1;
    const value = parseFloat(viewOf(element).getComputedStyle?.(element).getPropertyValue('--ds-time-scale') ?? '');
    return value > 0 ? value : 1;
    }
    function nextFrame(doc, callback) {
    const view = doc.defaultView ?? globalThis;
    if (doc.hidden || typeof view.requestAnimationFrame !== 'function') setTimeout(callback);
    else view.requestAnimationFrame(callback);
    }
    const savebars = new WeakMap();
    let savebarWarned = false;
    function savebar(element, options = {}) {
    const existing = savebars.get(element);
    if (existing) return existing;
    const doc = element.ownerDocument;
    const view = viewOf(element);
    const bar = (element.matches('.ds-savebar__bar') ? element : element.querySelector('.ds-savebar__bar') ?? element);
    const wrapper = (bar.closest('.ds-savebar'));
    const scroller = ((wrapper ?? bar).closest('.ds-view'));
    if (!scroller && !savebarWarned) {
    savebarWarned = true;
    view.console?.warn('Z-Dash: DS.overlay.savebar() outside .ds-view. The bar shows and hides, but no view keeps room for it or scrolls focus clear of it.');
    }
    let shown = false;
    let gen = 0;
    let height = 0;
    let leaving = (null);
    const pending = ([]);
    let observer = (null);
    let resting = false;
    let restRoom = 0;
    const gap = () => pxOf(bar, '--ds-space-2', 8);
    const offset = () => parseFloat(view.getComputedStyle?.(bar).bottom ?? '') || 0;
    const barTop = () => (wrapper ? wrapper.getBoundingClientRect().bottom - offset() : bar.getBoundingClientRect().bottom) - height;
    const entry = {
    element: bar,
    lift(region) {
    const style = view.getComputedStyle?.(region);
    if (!style) return 0;
    const lifted = parseFloat( (region).style.getPropertyValue('--ds-toast-lift')) || 0;
    const floor = (doc.documentElement.clientHeight || view.innerHeight) - ((parseFloat(style.bottom) || 0) - lifted) - (parseFloat(style.marginBottom) || 0);
    const top = barTop();
    if (top + height <= floor - (region).offsetHeight) return 0;
    return Math.max(0, floor - (top - gap()));
    },
    };
    for (const name of ['hidden', 'inert']) own(bar, 'attrs', name);
    if (scroller) {
    for (const name of ['data-ds-savebar', 'data-ds-savebar-rest']) own(scroller, 'attrs', name);
    own(scroller, 'props', '--ds-savebar-height');
    }
    function regions() {
    const theme = bar.closest('.ds-theme');
    const scope = theme ?? doc;
    return [...scope.querySelectorAll('.ds-toasts')].filter((region) => (!theme || region.closest('.ds-theme') === theme) && !parts.toast?.hosted(region));
    }
    function measure() {
    height = bar.offsetHeight;
    scroller?.style.setProperty('--ds-savebar-height', `${round(height)}px`);
    }
    function flush() {
    while (pending.length) {
    const fn = (pending.shift());
    try {
    fn();
    } catch (error) {
    report(bar, error);
    }
    }
    }
    function onScroll() {
    if (!scroller || scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop >= restRoom) stopRest();
    }
    function startRest() {
    if (!scroller) return;
    restRoom = height + offset() + gap();
    resting = true;
    scroller.setAttribute('data-ds-savebar-rest', '');
    scroller.addEventListener('scroll', onScroll, { passive: true });
    }
    function stopRest() {
    if (!resting || !scroller) return;
    resting = false;
    scroller.removeEventListener('scroll', onScroll);
    scroller.removeAttribute('data-ds-savebar-rest');
    if (!shown) scroller.style.removeProperty('--ds-savebar-height');
    }
    function keepClear() {
    const active = scroller ? activeIn(scroller) : null;
    if (!active || active === scroller || !scroller?.contains(active) || bar.contains(active) || typeof active.scrollIntoView !== 'function') return;
    if (active.getBoundingClientRect().bottom > barTop() - gap()) active.scrollIntoView({ block: 'nearest' });
    }
    function show() {
    if (shown) return;
    shown = true;
    gen += 1;
    leaving = null;
    flush();
    stopRest();
    bar.inert = false;
    bar.hidden = false;
    measure();
    scroller?.setAttribute('data-ds-savebar', '');
    shownSavebars.add(entry);
    for (const region of regions()) parts.toast?.lift(region);
    const Observer = view.ResizeObserver;
    if (!observer && typeof Observer === 'function') {
    observer = new Observer(() => {
    if (!shown || bar.offsetHeight === height) return;
    measure();
    for (const region of regions()) parts.toast?.lift(region);
    });
    observer.observe(bar);
    }
    keepClear();
    }
    function hide() {
    if (!shown) return;
    shown = false;
    const mine = ++gen;
    if (bar.contains(activeIn(bar))) {
    let target = null;
    try {
    target = options.focusTarget?.() ?? null;
    } catch (error) {
    report(bar, error);
    }
    const fallback = scroller ?? doc.querySelector(LANDMARK);
    const next = [target, fallback].find((node) => canFocus(node) && !bar.contains(node));
    next?.focus({ preventScroll: true });
    }
    const atEnd = Boolean(scroller) && scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 1;
    observer?.disconnect();
    observer = null;
    bar.inert = true;
    bar.hidden = true;
    shownSavebars.delete(entry);
    for (const region of regions()) parts.toast?.lift(region);
    if (scroller) {
    scroller.removeAttribute('data-ds-savebar');
    if (atEnd) startRest();
    else scroller.style.removeProperty('--ds-savebar-height');
    }
    leaving = settled(bar, { transitions: true }).then(() => {
    if (mine !== gen) return;
    leaving = null;
    bar.inert = false;
    flush();
    });
    }
    const handle = {
    element,
    show,
    hide,
    update(fn) {
    if (typeof fn !== 'function') return;
    if (leaving) pending.push(fn);
    else fn();
    },
    get shown() {
    return shown;
    },
    destroy() {
    gen += 1;
    observer?.disconnect();
    observer = null;
    leaving = null;
    pending.length = 0;
    stopRest();
    if (shownSavebars.delete(entry)) for (const region of regions()) parts.toast?.lift(region);
    bar.inert = false;
    for (const name of ['hidden', 'inert']) disown(bar, 'attrs', name);
    if (scroller) {
    scroller.removeAttribute('data-ds-savebar');
    scroller.style.removeProperty('--ds-savebar-height');
    for (const name of ['data-ds-savebar', 'data-ds-savebar-rest']) disown(scroller, 'attrs', name);
    disown(scroller, 'props', '--ds-savebar-height');
    }
    savebars.delete(element);
    },
    };
    savebars.set(element, handle);
    if (!bar.hidden) {
    bar.hidden = true;
    show();
    }
    return handle;
    }
    function confirm(options = {}) {
    return partFor('dialog', 'confirm').confirm(options);
    }
    function alert(options = {}) {
    return partFor('dialog', 'alert').alert(options);
    }
    function prompt(options = {}) {
    return partFor('dialog', 'prompt').prompt(options);
    }
    function toastRegion(doc = globalThis.document) {
    return partFor('toast', 'toastRegion').toastRegion(doc);
    }
    function announce(text, options = {}) {
    return partFor('toast', 'announce').announce(text, options);
    }
    function toast(region, content, options = {}) {
    return partFor('toast', 'toast').toast(region, content, options);
    }
    function closeToasts(region, filter = {}) {
    return partFor('toast', 'closeToasts').closeToasts(region, filter);
    }
    function tooltips(root = globalThis.document) {
    return partFor('tooltip', 'tooltips').tooltips(root);
    }
    function targetOf(trigger, value) {
    const scope = trigger.getRootNode?.() ?? trigger.ownerDocument;
    let found = null;
    try {
    found = scope.querySelector(value);
    } catch {
    }
    return found ?? scope.getElementById?.(value) ?? null;
    }
    function isOpen(element) {
    return overlays.get(element)?.phase === 'open';
    }
    define('triggers', {
    global(root) {
    const onClick = ( event) => {
    if (event.defaultPrevented || event.detail > 1) return;
    const trigger = (event.target)?.closest?.('[data-ds-open], [data-ds-close]');
    if (!trigger) return;
    const opens = trigger.getAttribute('data-ds-open');
    if (opens) {
    const target = targetOf(trigger, opens);
    if (!target) return;
    if (isOpen(target) && overlays.get(target)?.opener === trigger) closeFrom(target, 'close');
    else open(target, { opener: trigger });
    return;
    }
    const closes = trigger.getAttribute('data-ds-close');
    const target = closes ? targetOf(trigger, closes) : null;
    if (target && isOpen(target)) closeFrom(target, 'close');
    };
    const onKeyDown = ( event) => {
    if (event.defaultPrevented || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
    const trigger = (event.target)?.closest?.('[data-ds-open]');
    const target = trigger ? targetOf(trigger, trigger.getAttribute('data-ds-open') ?? '') : null;
    if (!target?.matches('.ds-menu') || isOpen(target)) return;
    event.preventDefault();
    open(target, { opener: trigger });
    };
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeyDown);
    return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeyDown);
    };
    },
    });
    function controllerOf(element) {
    const listeners = ([]);
    return {
    element,
    get: () => isOpen(element),
    set: (value, options) => (value ? open(element, options) : close(element, options)),
    on(type, fn) {
    const name = `ds:${type}`;
    element.addEventListener(name, fn);
    const off = () => element.removeEventListener(name, fn);
    listeners.push(off);
    return off;
    },
    destroy() {
    for (const off of listeners.splice(0)) off();
    },
    };
    }
    const internals = Object.freeze({
    overlays,
    stack,
    tooltipControllers,
    neverInert,
    shownSavebars,
    LANDMARK,
    activeIn,
    inside,
    sharedOf,
    own,
    disown,
    viewOf,
    flushStyle,
    canFocus,
    report,
    watchModality,
    composedContains,
    keepAway,
    keepHome,
    closeFrom,
    layerOver,
    opensOpenLayer,
    arrowTarget,
    topOpen,
    nextAnchorName,
    placeMenu,
    isOpen,
    controllerOf,
    clock,
    normalText,
    timeScaleOf,
    nextFrame,
    part: (name) => parts[name] ?? null,
    use(name, part) {
    parts[name] ??= part;
    pageParts[name] ??= part;
    },
    });

    return Object.freeze({
      TOAST_MS: TOAST_MS,
      TOAST_MAX_MS: TOAST_MAX_MS,
      TOAST_LIMIT: TOAST_LIMIT,
      TOOLTIP_DELAY_MS: TOOLTIP_DELAY_MS,
      TOOLTIP_SKIP_MS: TOOLTIP_SKIP_MS,
      TOOLTIP_HIDE_MS: TOOLTIP_HIDE_MS,
      DISMISS_DELAY_MS: DISMISS_DELAY_MS,
      DRAWER_QUERY: DRAWER_QUERY,
      FOCUSABLE: FOCUSABLE,
      canFocus: canFocus,
      holdInert: holdInert,
      lockScroll: lockScroll,
      unlockScroll: unlockScroll,
      typeAhead: typeAhead,
      open: open,
      close: close,
      topmost: topmost,
      layerAt: layerAt,
      savebar: savebar,
      confirm: confirm,
      alert: alert,
      prompt: prompt,
      toastRegion: toastRegion,
      announce: announce,
      toast: toast,
      closeToasts: closeToasts,
      tooltips: tooltips,
      internals: internals
    });
  });

  add('a11y', ['canTakeFocus', 'tabbables', 'readsKeys', 'trap', 'roving', 'typeaheadMatch', 'typeahead', 'announce', 'inert'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const runtime = DS.core.runtime;
    const motionDuration = DS.motion.motionDuration;
    const rovingOf = DS.dom.roving, typesText = DS.dom.typesText;
    const announceOf = DS.overlay.announce, canFocus = DS.overlay.canFocus, FOCUSABLE = DS.overlay.FOCUSABLE, holdInert = DS.overlay.holdInert, layerAt = DS.overlay.layerAt, typeAhead = DS.overlay.typeAhead;
    const shared = runtime.state('a11y', () => ({ stacks: new WeakMap(), traps: new WeakMap() }));
    const isRadio = (node) => node.tagName === 'INPUT' && node.type === 'radio' && Boolean(node.name);
    function canTakeFocus(node) {
    if (!canFocus(node) || node.matches?.(':disabled')) return false;
    return typeof node.checkVisibility !== 'function' || node.checkVisibility({ checkVisibilityCSS: true });
    }
    function tabbables(root) {
    if (!root?.querySelectorAll) return [];
    const candidates = [...root.querySelectorAll(FOCUSABLE)].filter((node) => Number(node.getAttribute('tabindex')) >= 0 && canTakeFocus(node));
    const groups = new Map();
    for (const node of candidates) {
    if (!isRadio(node)) continue;
    if (!groups.has(node.name) || node.checked) groups.set(node.name, node);
    }
    return candidates.filter((node) => !isRadio(node) || groups.get(node.name) === node);
    }
    const KEY_WIDGETS = '[role="textbox"], [role="searchbox"], [role="combobox"], [role="spinbutton"], [role="listbox"], [role="menu"], [role="menubar"], [role="tree"], [role="treegrid"]';
    function readsKeys(node) {
    if (!node?.closest) return false;
    return typesText(node) || node.tagName === 'SELECT' || Boolean(node.closest(KEY_WIDGETS));
    }
    function deepActive(doc) {
    let active = doc.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
    }
    function aroundNode(list, node, backwards) {
    if (backwards) return [...list].reverse().find((each) => node.compareDocumentPosition(each) & node.DOCUMENT_POSITION_PRECEDING) ?? list[list.length - 1];
    return list.find((each) => node.compareDocumentPosition(each) & node.DOCUMENT_POSITION_FOLLOWING) ?? list[0];
    }
    const holds = (item) => canTakeFocus(item.container) || tabbables(item.container).length > 0;
    function pruneRemoved(stack) {
    for (const item of [...stack]) if (!item.container.isConnected) item.destroy();
    }
    function trap(container, options = {}) {
    const doc = container?.ownerDocument;
    if (!doc) return { destroy() {} };
    const existing = shared.traps.get(container);
    if (existing) return existing;
    const scope = container.getRootNode?.() ?? doc;
    const activeNow = () => scope.activeElement ?? null;
    const before = deepActive(doc);
    const addedTabindex = !container.hasAttribute('tabindex');
    const stack = shared.stacks.get(doc) ?? [];
    shared.stacks.set(doc, stack);
    const entry = { last: null, container, destroy: () => handle.destroy() };
    stack.push(entry);
    const focusBox = () => {
    if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
    (container).focus();
    };
    const under = (node) => {
    const layer = node ? layerAt(node, doc) : null;
    return Boolean(layer && !layer.contains(container));
    };
    const resting = (node) => [...stack].reverse().find(holds) !== entry || under(container) || under(node);
    const onKey = ( event) => {
    if (event.key !== 'Tab') return;
    pruneRemoved(stack);
    if (event.defaultPrevented || resting(deepActive(doc))) return;
    const active = activeNow();
    const toasts = active?.closest?.('.ds-toasts');
    if (toasts) {
    const own = tabbables(toasts);
    if (active !== own[event.shiftKey ? 0 : own.length - 1]) return;
    }
    const list = tabbables(container);
    const first = list[0];
    const last = list[list.length - 1];
    let next = null;
    if (!first) next = container;
    else if (!active || !container.contains(active)) next = event.shiftKey ? last : first;
    else if (!list.includes(active)) next = aroundNode(list, active, event.shiftKey);
    else if (event.shiftKey && active === first) next = last;
    else if (!event.shiftKey && active === last) next = first;
    if (!next) return;
    event.preventDefault();
    if (next === container) focusBox();
    else next.focus();
    };
    const onFocus = ( event) => {
    pruneRemoved(stack);
    const path = event.composedPath?.() ?? [event.target];
    if (path.includes(container)) {
    entry.last = path[0];
    return;
    }
    if (resting(path[0]) || path.some((node) => node.matches?.('.ds-toasts'))) return;
    const back = canTakeFocus(entry.last) && container.contains(entry.last) ? entry.last : tabbables(container)[0];
    if (back) back.focus();
    else focusBox();
    };
    doc.addEventListener('keydown', onKey, true);
    doc.addEventListener('focusin', onFocus, true);
    const active = activeNow();
    if (options.initial !== false && (options.initial !== undefined || !active || !container.contains(active))) {
    const wanted = typeof options.initial === 'string' ? container.querySelector(options.initial)
    : options.initial ?? container.querySelector('[autofocus]');
    const target = canTakeFocus(wanted) ? wanted : tabbables(container)[0];
    if (target) (target).focus();
    else focusBox();
    } else if (active && container.contains(active)) entry.last = active;
    const handle = {
    destroy() {
    if (shared.traps.get(container) !== handle) return;
    shared.traps.delete(container);
    stack.splice(stack.indexOf(entry), 1);
    doc.removeEventListener('keydown', onKey, true);
    doc.removeEventListener('focusin', onFocus, true);
    const now = doc.activeElement;
    const lost = !now || now === doc.body || container.contains(activeNow());
    if (addedTabindex) container.removeAttribute('tabindex');
    const home = options.returnFocus === undefined ? before : options.returnFocus;
    if (home && lost && canTakeFocus(home)) (home).focus();
    },
    };
    shared.traps.set(container, handle);
    return handle;
    }
    function roving(container, options = {}) {
    return rovingOf(container, options);
    }
    const TYPEAHEAD_ITEMS = '[role="option"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="treeitem"], [role="tab"], [role="radio"]';
    const labelOf = (item) => (item.getAttribute?.('aria-label') || item.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    function typeaheadMatch(items, current, typed, label = labelOf) {
    return typeAhead(items, current, typed, label);
    }
    const typeaheads = new WeakMap();
    function typeahead(container, options = {}) {
    if (!container?.addEventListener) return { destroy() {} };
    const existing = typeaheads.get(container);
    if (existing) return existing;
    const selector = options.items ?? TYPEAHEAD_ITEMS;
    const items = () => (typeof selector === 'function' ? [...selector()] : [...container.querySelectorAll(selector)]).filter(canTakeFocus);
    const currentOf = (list, target) => {
    const holding = list.find((item) => item === target || item.contains(target));
    if (holding) return holding;
    const named = container.getAttribute?.('aria-activedescendant');
    return (named ? container.getRootNode().getElementById?.(named) : null) ?? options.current?.();
    };
    let typed = '';
    let typedAt = 0;
    const onKey = ( event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const target = (event.target);
    if (typesText(target) || target?.tagName === 'SELECT') return;
    const key = event.key ?? '';
    if (key.length !== 1) {
    if (/^(arrow|home|end|page)/i.test(key)) typed = '';
    return;
    }
    if (event.timeStamp - typedAt > motionDuration(container, '--ds-delay-tooltip')) typed = '';
    if (key === ' ' && !typed) return;
    typedAt = event.timeStamp;
    typed += key.toLowerCase();
    const list = items();
    const match = typeaheadMatch(list, currentOf(list, target), typed, options.label);
    if (!match) return;
    event.preventDefault();
    if (typeof options.onMatch === 'function') options.onMatch(match);
    else (match).focus();
    };
    container.addEventListener('keydown', onKey);
    const handle = {
    destroy() {
    if (typeaheads.get(container) !== handle) return;
    typeaheads.delete(container);
    container.removeEventListener('keydown', onKey);
    },
    };
    typeaheads.set(container, handle);
    return handle;
    }
    function announce(text, options = {}) {
    announceOf(text, options);
    }
    function inert(elements) {
    if (!elements) return holdInert([]);
    return holdInert(elements.nodeType ? [elements] : elements);
    }

    return Object.freeze({
      canTakeFocus: canTakeFocus,
      tabbables: tabbables,
      readsKeys: readsKeys,
      trap: trap,
      roving: roving,
      typeaheadMatch: typeaheadMatch,
      typeahead: typeahead,
      announce: announce,
      inert: inert
    });
  });

  add('format', ['number', 'percent', 'currency', 'bytes', 'duration', 'list', 'plural', 'relative', 'absolute', 'clock', 'time'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const config = DS.core.config, define = DS.core.define, runtime = DS.core.runtime;
    const SECOND = 1000;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const MONTH = 30.436875 * DAY;
    const YEAR = 365.2425 * DAY;
    const RELATIVE_UNITS = Object.freeze([['year', YEAR], ['month', MONTH], ['week', WEEK], ['day', DAY], ['hour', HOUR], ['minute', MINUTE], ['second', SECOND]]);
    const DURATION_UNITS = Object.freeze([['day', DAY], ['hour', HOUR], ['minute', MINUTE], ['second', SECOND], ['millisecond', 1]]);
    const BYTE_UNITS = Object.freeze(['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte']);
    const BINARY_SYMBOLS = Object.freeze(['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']);
    const FORMATTERS = 256;
    const SHORTEST_WAIT = 200;
    const LONGEST_WAIT = 2 ** 31 - 1;
    const TIME_OPTIONS = Object.freeze(['style', 'numeric', 'smallest', 'largest']);
    const shared = runtime.state('format', () => ({
    clients: new Set(),
    timer: null,
    listening: null,
    times: new WeakMap(),
    }));
    const formatters = new Map();
    const accepted = new Map();
    function localeFor(options) {
    const locale = options?.locale ?? config().locale;
    if (!accepted.has(locale)) {
    let good = locale;
    try {
    Intl.getCanonicalLocales(locale);
    } catch {
    good = undefined;
    }
    accepted.set(locale, good);
    }
    return accepted.get(locale);
    }
    function formatter(Type, name, locale, settings) {
    const key = `${name}|${locale ?? ''}|${JSON.stringify(settings)}`;
    let made = formatters.get(key);
    if (!made) {
    made = new Type(locale, settings);
    if (formatters.size >= FORMATTERS) formatters.clear();
    formatters.set(key, made);
    }
    return made;
    }
    function intlOptions(options, ...own) {
    const settings = { ...options };
    for (const name of ['locale', 'empty', ...own]) delete settings[name];
    return settings;
    }
    const numberFormat = (locale, settings) => formatter(Intl.NumberFormat, 'number', locale, settings);
    function numeric(value) {
    if (typeof value === 'bigint') return value;
    if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
    }
    function toDate(value) {
    if (value === null || value === undefined || value === '') return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
    }
    function number(value, options = {}) {
    const parsed = numeric(value);
    if (parsed === null) return options.empty ?? '';
    return numberFormat(localeFor(options), intlOptions(options)).format(parsed);
    }
    function percent(value, options = {}) {
    return number(value, { ...options, style: 'percent' });
    }
    function currency(value, code, options = {}) {
    return number(value, { ...options, style: 'currency', currency: code });
    }
    function bytes(value, options = {}) {
    const parsed = numeric(value);
    if (parsed === null) return options.empty ?? '';
    const base = options.base === 1024 ? 1024 : 1000;
    const size = Number(parsed);
    const magnitude = Math.abs(size);
    let power = magnitude >= 1 ? Math.min(Math.floor(Math.log(magnitude) / Math.log(base)), BYTE_UNITS.length - 1) : 0;
    const digits = options.maximumFractionDigits ?? 1;
    const places = 10 ** digits;
    if (power < BYTE_UNITS.length - 1 && Math.round((magnitude / base ** power) * places) / places >= base) power += 1;
    const settings = intlOptions(options, 'base');
    if (settings.maximumFractionDigits === undefined) settings.maximumFractionDigits = Math.max(power === 0 ? 0 : 1, settings.minimumFractionDigits ?? 0);
    const figure = size / base ** power;
    const locale = localeFor(options);
    if (base === 1024 || (power === 0 && !settings.unitDisplay)) return `${numberFormat(locale, settings).format(figure)} ${BINARY_SYMBOLS[power]}`;
    return numberFormat(locale, { ...settings, style: 'unit', unit: BYTE_UNITS[power] }).format(figure);
    }
    function duration(value, options = {}) {
    const parsed = numeric(value);
    if (parsed === null) return options.empty ?? '';
    const ms = Number(parsed);
    if (!Number.isFinite(ms)) return options.empty ?? '';
    const negative = ms < 0;
    const locale = localeFor(options);
    const style = options.style ?? 'short';
    if (style === 'clock') {
    const total = Math.round(Math.abs(ms) / SECOND);
    const hours = Math.floor(total / 3600);
    const pad = numberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
    const plain = numberFormat(locale, { useGrouping: false });
    const minutes = Math.floor(total / 60) % 60;
    const seconds = pad.format(total % 60);
    const lead = hours || minutes;
    const first = plain.format(negative ? -lead : lead);
    return hours ? `${first}:${pad.format(minutes)}:${seconds}` : `${first}:${seconds}`;
    }
    const magnitude = Math.abs(ms);
    const named = DURATION_UNITS.findIndex(([unit]) => unit === options.smallest);
    const floor = named >= 0 ? named : magnitude > 0 && magnitude < SECOND - 0.5 ? DURATION_UNITS.length - 1 : DURATION_UNITS.length - 2;
    const parts = Math.max(1, options.parts ?? 2);
    const fit = (amount) => {
    const largest = DURATION_UNITS.findIndex(([, size]) => amount >= size);
    const last = Math.min(floor, (largest < 0 ? floor : largest) + parts - 1);
    const size = DURATION_UNITS[last][1];
    return Math.round(amount / size) * size;
    };
    let left = fit(fit(magnitude));
    const pieces = [];
    for (const [index, [unit, size]] of DURATION_UNITS.entries()) {
    if (index > floor) break;
    const count = Math.floor(left / size + 1e-9);
    if (count) {
    pieces.push([unit, count]);
    left -= count * size;
    }
    }
    if (!pieces.length) pieces.push([DURATION_UNITS[floor][0], 0]);
    const formatted = pieces.map(([unit, count], index) => numberFormat(locale, { style: 'unit', unit, unitDisplay: style }).format(negative && index === 0 ? -count : count));
    return formatter(Intl.ListFormat, 'list', locale, { type: 'unit', style }).format(formatted);
    }
    function list(items, options = {}) {
    const texts = Array.from(items ?? [], (item) => (item === null || item === undefined ? '' : String(item))).filter(Boolean);
    if (!texts.length) return options.empty ?? '';
    return formatter(Intl.ListFormat, 'list', localeFor(options), intlOptions(options)).format(texts);
    }
    function plural(count, forms, options = {}) {
    const parsed = numeric(count);
    if (parsed === null) return options.empty ?? '';
    const amount = Number(parsed);
    const locale = localeFor(options);
    const category = formatter(Intl.PluralRules, 'plural', locale, { type: options.type ?? 'cardinal' }).select(amount);
    const form = forms?.[`=${amount}`] ?? forms?.[category] ?? forms?.other;
    if (form === undefined || form === null) return options.empty ?? '';
    const formatted = numberFormat(locale, intlOptions(options, 'type')).format(amount);
    return typeof form === 'function' ? String(form({ count: amount, formatted })) : String(form).replace(/\{count\}/g, formatted);
    }
    function relativeParts(difference, options) {
    const magnitude = Math.abs(difference);
    const named = (name, otherwise) => {
    const index = RELATIVE_UNITS.findIndex(([unit]) => unit === name);
    return index >= 0 ? index : otherwise;
    };
    const first = named(options.largest, 0);
    const last = Math.max(first, named(options.smallest, RELATIVE_UNITS.length - 1));
    let at = first;
    while (at < last && magnitude < RELATIVE_UNITS[at][1]) at += 1;
    const [unit, size] = RELATIVE_UNITS[at];
    return { unit, size, amount: Math.floor(magnitude / size) };
    }
    function relative(value, options = {}) {
    const date = toDate(value);
    if (!date) return options.empty ?? '';
    const now = options.now === undefined ? Date.now() : Number(options.now);
    const difference = date.getTime() - now;
    const { unit, amount } = relativeParts(difference, options);
    const settings = { style: options.style ?? 'long', numeric: options.numeric ?? 'auto' };
    return formatter(Intl.RelativeTimeFormat, 'relative', localeFor(options), settings).format(difference < 0 ? -amount : amount, unit);
    }
    function absolute(value, options = {}) {
    const date = toDate(value);
    if (!date) return options.empty ?? '';
    const settings = intlOptions(options);
    const named = Object.keys(settings).some((key) => key !== 'timeZone' && key !== 'hour12' && key !== 'hourCycle' && key !== 'calendar' && key !== 'numberingSystem');
    return formatter(Intl.DateTimeFormat, 'date', localeFor(options), named ? settings : { dateStyle: 'medium', timeStyle: 'short', ...settings }).format(date);
    }
    const pageHidden = () => globalThis.document?.visibilityState === 'hidden';
    function runClock(all = false) {
    shared.timer = null;
    const now = Date.now();
    for (const client of [...shared.clients]) {
    if (!all && client.due > now) continue;
    runClient(client, now);
    }
    armClock();
    }
    function runClient(client, now) {
    let wait;
    try {
    wait = client.fn(now);
    } catch (error) {
    if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
    else globalThis.console?.error?.(error);
    }
    client.due = now + (typeof wait === 'number' && wait >= 0 ? wait : SECOND);
    }
    function armClock() {
    clearTimeout(shared.timer);
    shared.timer = null;
    if (!shared.clients.size) {
    shared.listening?.();
    shared.listening = null;
    return;
    }
    const doc = globalThis.document;
    if (doc && !shared.listening && typeof doc.addEventListener === 'function') {
    const wake = () => {
    if (pageHidden()) {
    clearTimeout(shared.timer);
    shared.timer = null;
    } else runClock(true);
    };
    const reformat = ( event) => {
    if (event.detail?.changed?.includes('locale') && !pageHidden()) runClock(true);
    };
    doc.addEventListener('visibilitychange', wake);
    doc.addEventListener('ds:config', reformat);
    shared.listening = () => {
    doc.removeEventListener('visibilitychange', wake);
    doc.removeEventListener('ds:config', reformat);
    };
    }
    if (pageHidden()) return;
    let soonest = Infinity;
    for (const client of shared.clients) soonest = Math.min(soonest, client.due);
    shared.timer = setTimeout(() => runClock(), Math.min(LONGEST_WAIT, Math.max(SHORTEST_WAIT, soonest - Date.now())));
    shared.timer?.unref?.();
    }
    function clock(fn) {
    const client = { fn, due: 0 };
    shared.clients.add(client);
    runClient(client, Date.now());
    armClock();
    return () => {
    if (shared.clients.delete(client)) armClock();
    };
    }
    const OWNED = Symbol.for('ds.owned');
    function own(element, name) {
    const record = element[OWNED] ?? (element[OWNED] = { attrs: new Map(), classes: new Map(), props: new Map() });
    record.attrs.set(name, (record.attrs.get(name) ?? 0) + 1);
    }
    function disown(element, name) {
    const map = element[OWNED]?.attrs;
    const count = map?.get(name) ?? 0;
    if (count > 1) map.set(name, count - 1);
    else map?.delete(name);
    }
    function nextChange(difference, size) {
    const magnitude = Math.abs(difference);
    const rest = magnitude % size;
    return Math.min(HOUR, difference < 0 ? size - rest : rest + 1);
    }
    function time(el, options = {}) {
    const idle = { get: () => ({ value: null, text: '' }), set() {}, on: () => () => {}, update() {}, destroy() {} };
    if (!el?.ownerDocument) return idle;
    const existing = shared.times.get(el);
    if (existing) return existing;
    const listeners = new Set();
    let live = true;
    let seen = el.isConnected;
    let wroteTip = false;
    let stop = () => {};
    let watcher = null;
    const source = () => el.getAttribute('data-ds-time') || el.getAttribute('datetime') || null;
    const setting = (name) => options[name] ?? (el.getAttribute(`data-ds-time-${name}`) || undefined);
    const settings = () => {
    const out = {};
    for (const name of TIME_OPTIONS) {
    const value = setting(name);
    if (value !== undefined) out[name] = value;
    }
    if (options.locale) out.locale = options.locale;
    return out;
    };
    const writeTip = (date) => {
    const off = options.tip === false || el.getAttribute('data-ds-time-tip') === 'off';
    if (off || !date) {
    if (wroteTip) {
    wroteTip = false;
    el.removeAttribute('data-tip');
    disown(el, 'data-tip');
    }
    return;
    }
    if (!wroteTip) {
    if (el.hasAttribute('data-tip')) return;
    wroteTip = true;
    own(el, 'data-tip');
    }
    const text = absolute(date, options.locale ? { locale: options.locale } : {});
    if (el.getAttribute('data-tip') !== text) el.setAttribute('data-tip', text);
    };
    const render = (now = Date.now()) => {
    const date = toDate(source());
    writeTip(date);
    if (!date) return HOUR;
    const current = settings();
    const text = relative(date, { ...current, now });
    if (el.textContent !== text) {
    if (el.childNodes.length === 1 && el.firstChild.nodeType === 3) el.firstChild.nodeValue = text;
    else el.textContent = text;
    watcher?.takeRecords();
    for (const fn of [...listeners]) fn({ value: date, text });
    }
    return nextChange(date.getTime() - now, relativeParts(date.getTime() - now, current).size);
    };
    const controller = {
    get() {
    return { value: toDate(source()), text: el.textContent ?? '' };
    },
    set(value) {
    const date = toDate(value);
    const name = el.getAttribute('data-ds-time') || el.localName !== 'time' ? 'data-ds-time' : 'datetime';
    el.setAttribute(name, date ? date.toISOString() : '');
    render();
    },
    on(type, fn) {
    if (type !== 'change') return () => {};
    listeners.add(fn);
    return () => listeners.delete(fn);
    },
    update() {
    if (live) render();
    },
    destroy() {
    if (!live) return;
    live = false;
    stop();
    watcher?.disconnect();
    listeners.clear();
    if (wroteTip) {
    wroteTip = false;
    el.removeAttribute('data-tip');
    disown(el, 'data-tip');
    }
    if (shared.times.get(el) === controller) shared.times.delete(el);
    },
    };
    shared.times.set(el, controller);
    if (options.value !== undefined) {
    const date = toDate(options.value);
    if (date) el.setAttribute(el.getAttribute('data-ds-time') || el.localName !== 'time' ? 'data-ds-time' : 'datetime', date.toISOString());
    }
    const Observer = el.ownerDocument.defaultView?.MutationObserver ?? globalThis.MutationObserver;
    if (typeof Observer === 'function') {
    watcher = new Observer(() => {
    if (live) render();
    });
    watcher.observe(el, { childList: true, characterData: true, subtree: true });
    }
    if (!seen) render();
    stop = clock((now) => {
    if (!el.isConnected) {
    if (seen) {
    controller.destroy();
    return HOUR;
    }
    return SECOND;
    }
    seen = true;
    return render(now);
    });
    return controller;
    }
    define('time', {
    attribute: 'data-ds-time',
    attributes: ['datetime', ...TIME_OPTIONS.map((name) => `data-ds-time-${name}`), 'data-ds-time-tip'],
    init: (el) => time(el),
    });

    return Object.freeze({
      number: number,
      percent: percent,
      currency: currency,
      bytes: bytes,
      duration: duration,
      list: list,
      plural: plural,
      relative: relative,
      absolute: absolute,
      clock: clock,
      time: time
    });
  });

  add('dialog', ['open', 'close', 'confirm', 'alert', 'prompt', 'form', 'create'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, emit = DS.core.emit, t = DS.core.t;
    const busy = DS.motion.busy;
    const alertCircle = DS.icons.alertCircle, iconElement = DS.icons.iconElement;
    const watchScrolled = DS.dom.watchScrolled;
    const tabbables = DS.a11y.tabbables;
    const internals = DS.overlay.internals, openOverlay = DS.overlay.open, closeOverlay = DS.overlay.close;
    const { overlays, activeIn, sharedOf, canFocus, arrowTarget, controllerOf, part } = internals;
    function open(element, options = {}) {
    return openOverlay(element, options);
    }
    function close(element, options = {}) {
    return closeOverlay(element, options);
    }
    function confirm(options = {}) {
    return (ask('confirm', options));
    }
    function alert(options = {}) {
    return (ask('alert', options));
    }
    function prompt(options = {}) {
    return (ask('prompt', options));
    }
    const declined = (kind) => (kind === 'confirm' ? false : kind === 'prompt' ? null : undefined);
    function ask(kind, options) {
    const opener = options.opener ?? null;
    const doc = opener?.ownerDocument ?? globalThis.document;
    if (!doc?.createElement || !doc.body) return Promise.resolve(declined(kind));
    const theme = opener?.closest?.('.ds-theme') ?? activeIn(doc.body)?.closest?.('.ds-theme') ?? doc.querySelector('.ds-theme');
    const home = !theme || theme === doc.documentElement ? doc.body : theme;
    const id = `ds-ask-${sharedOf(doc).seq += 1}`;
    const make = (tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
    };
    const native = typeof make('dialog').showModal === 'function';
    const dialog = make(native ? 'dialog' : 'div', 'ds-dialog');
    const box = make('div', 'ds-dialog__box');
    const labelled = native ? dialog : box;
    const role = kind === 'alert' || options.destructive ? 'alertdialog' : 'dialog';
    if (native) {
    if (role === 'alertdialog') dialog.setAttribute('role', role);
    } else {
    dialog.hidden = true;
    box.setAttribute('role', role);
    box.setAttribute('aria-modal', 'true');
    }
    const backdrop = make('div', 'ds-dialog__backdrop');
    backdrop.setAttribute('data-ds-close', '');
    const title = make('h2', 'ds-dialog__title', options.title ?? '');
    title.id = `${id}-title`;
    labelled.setAttribute('aria-labelledby', title.id);
    box.append(title);
    if (options.text) {
    const text = make('p', 'ds-dialog__text', options.text);
    text.id = `${id}-text`;
    labelled.setAttribute('aria-describedby', text.id);
    box.append(text);
    }
    const lines = Array.isArray(options.lines) ? options.lines.filter((line) => line != null && String(line) !== '') : [];
    if (lines.length) {
    const list = make('ul', 'ds-dialog__lines');
    for (const line of lines) list.append(make('li', '', line));
    box.append(list);
    }
    const facts = Array.isArray(options.facts) ? options.facts.filter((fact) => Array.isArray(fact) && fact.length >= 2) : [];
    if (facts.length) {
    const list = make('dl', 'ds-dialog__facts');
    for (const [term, value] of facts) {
    const row = make('div', '');
    row.append(make('dt', '', term), make('dd', '', value));
    list.append(row);
    }
    box.append(list);
    }
    let field = null;
    if (kind === 'prompt') {
    const wrap = make('div', 'ds-field');
    const label = make('label', 'ds-field__label', options.label ?? '');
    field = (make('input', 'ds-input'));
    field.id = `${id}-field`;
    label.htmlFor = field.id;
    const input = options.input ?? {};
    field.type = input.type ?? 'text';
    if (input.autocomplete) field.setAttribute('autocomplete', input.autocomplete);
    if (input.inputmode) field.setAttribute('inputmode', input.inputmode);
    if (input.required) field.required = true;
    if (typeof input.spellcheck === 'boolean') field.setAttribute('spellcheck', String(input.spellcheck));
    for (const name of ['autocapitalize', 'autocorrect', 'enterkeyhint']) {
    if (input[name]) field.setAttribute(name, input[name]);
    }
    field.value = options.value ?? '';
    field.setAttribute('autofocus', '');
    wrap.append(label, field);
    box.append(wrap);
    }
    const actions = make('div', 'ds-dialog__actions');
    const button = (className, text) => {
    const node = (make('button', className, text));
    node.type = 'button';
    return node;
    };
    let cancel = null;
    let confirmButton;
    if (kind === 'alert') {
    confirmButton = button('ds-btn ds-btn--filled', options.closeLabel ?? t('ok'));
    confirmButton.setAttribute('data-ds-close', '');
    confirmButton.setAttribute('autofocus', '');
    actions.append(confirmButton);
    } else {
    cancel = button('ds-btn ds-btn--text', options.cancelLabel ?? t('cancel'));
    cancel.setAttribute('data-ds-close', '');
    const label = options.confirmLabel ?? t('confirm');
    confirmButton = button(options.destructive ? 'ds-btn ds-btn--filled ds-tone-error' : 'ds-btn ds-btn--filled');
    const faces = make('span', 'ds-btn__faces');
    const rest = make('span', 'ds-btn__face', label);
    const working = make('span', 'ds-btn__face ds-btn__face--busy');
    working.setAttribute('aria-hidden', 'true');
    working.append(make('span', 'ds-spinner ds-spinner--ink ds-sm'), doc.createTextNode(label));
    faces.append(rest, working);
    confirmButton.append(faces);
    if (options.destructive) cancel.setAttribute('autofocus', '');
    else if (!field) confirmButton.setAttribute('autofocus', '');
    actions.append(cancel, confirmButton);
    }
    box.append(actions);
    dialog.append(backdrop, box);
    return new Promise((resolve) => {
    dialog.addEventListener('ds:close', (event) => {
    if (event.target !== dialog) return;
    const reason = (event).detail?.reason;
    resolve(reason === 'confirm' ? (kind === 'confirm' ? true : kind === 'prompt' ? field?.value ?? '' : undefined) : declined(kind));
    Promise.resolve(overlays.get(dialog)?.closing).then(() => {
    if (overlays.get(dialog)?.phase !== 'open') dialog.remove();
    });
    });
    if (kind === 'alert') {
    home.append(dialog);
    open(dialog, { opener });
    return;
    }
    let hint = null;
    const invalid = ( input) => {
    const text = String(options.requiredText ?? t('valueRequired'));
    if (!hint) {
    hint = make('small', 'ds-field__hint ds-field__hint--error');
    hint.id = `${id}-error`;
    hint.append(iconElement(alertCircle, 16, undefined, doc), doc.createTextNode(text));
    input.parentElement?.append(hint);
    }
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', hint.id);
    input.focus();
    const speaker = part('toast');
    speaker?.announce(text, { assertive: true, region: speaker.regionOfTheme(doc, theme, home) });
    };
    const valid = () => {
    if (!field) return;
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    hint?.remove();
    hint = null;
    };
    const attempt = async () => {
    if (dialog.hasAttribute('data-ds-busy') || overlays.get(dialog)?.phase !== 'open') return;
    if (field?.required && !field.value.trim()) {
    invalid(field);
    return;
    }
    valid();
    if (typeof options.onConfirm !== 'function') {
    close(dialog, { reason: 'confirm' });
    return;
    }
    dialog.setAttribute('data-ds-busy', '');
    cancel?.setAttribute('aria-disabled', 'true');
    if (field) field.readOnly = true;
    const settle = () => {
    dialog.removeAttribute('data-ds-busy');
    cancel?.removeAttribute('aria-disabled');
    if (field) field.readOnly = false;
    };
    try {
    await busy(confirmButton, () => options.onConfirm(field?.value ?? undefined), { done: false });
    } catch {
    settle();
    if (!dialog.isConnected) return;
    const speaker = part('toast');
    const region = speaker?.regionOfTheme(doc, theme, home);
    if (region) speaker.toast(region, options.errorText ?? t('actionFailed'), { kind: 'error' });
    confirmButton.focus({ preventScroll: true });
    return;
    }
    settle();
    close(dialog, { reason: 'confirm' });
    };
    confirmButton.addEventListener('click', ( event) => {
    if (event.detail > 1) return;
    attempt();
    });
    field?.addEventListener('keydown', ( event) => {
    if (event.key !== 'Enter' || event.isComposing || event.defaultPrevented) return;
    event.preventDefault();
    attempt();
    });
    field?.addEventListener('input', valid);
    home.append(dialog);
    open(dialog, { opener });
    });
    }
    function wireDialogList(dialog) {
    dialog.addEventListener('keydown', ( event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const list = (event.target)?.closest?.('.ds-dialog__list');
    if (!list || !dialog.contains(list)) return;
    const next = arrowTarget([...list.querySelectorAll('.ds-menu__item')].filter(canFocus), event);
    if (!next) return;
    event.preventDefault();
    next.focus();
    });
    }
    const forms = new WeakMap();
    function form(element, options = {}) {
    forms.set(element, { onSubmit: options.onSubmit, errorText: options.errorText });
    return controllerOf(element);
    }
    const TYPED = 'textarea, input:not([type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"], [type="button"], [type="reset"], [type="submit"], [type="image"], [type="hidden"])';
    function holdForm(dialog, box, submit) {
    const undo = [() => dialog.removeAttribute('data-ds-busy')];
    dialog.setAttribute('data-ds-busy', '');
    for (const closer of box.querySelectorAll('[data-ds-close]')) {
    if (closer.getAttribute('aria-disabled') === 'true') continue;
    closer.setAttribute('aria-disabled', 'true');
    undo.push(() => closer.removeAttribute('aria-disabled'));
    }
    for (const control of box.elements) {
    if (control === submit || control.disabled || control.type === 'submit' || control.matches('fieldset, output, input[type="hidden"], [data-ds-close]')) continue;
    if (control.matches(TYPED)) {
    if (control.readOnly) continue;
    control.readOnly = true;
    undo.push(() => { control.readOnly = false; });
    } else if (!control.inert) {
    if (activeIn(control) === control && canFocus(submit)) submit.focus({ preventScroll: true });
    control.inert = true;
    undo.push(() => { control.inert = false; });
    }
    }
    return () => {
    for (const step of undo) step();
    };
    }
    function wireForm(dialog) {
    dialog.addEventListener('submit', async ( event) => {
    const box = (event.target);
    if (!box?.matches?.('form.ds-dialog__box') || box.closest('.ds-dialog') !== dialog || event.defaultPrevented) return;
    const setup = forms.get(dialog);
    if (!setup && !box.hasAttribute('data-ds-dialog-form')) return;
    event.preventDefault();
    if (dialog.hasAttribute('data-ds-busy') || overlays.get(dialog)?.phase !== 'open') return;
    const data = new FormData(box, (event).submitter);
    if (!emit(dialog, 'submit', { form: box, data }, { cancelable: true })) return;
    if (typeof setup?.onSubmit === 'function') {
    const submit = (event).submitter ?? box.querySelector('[type="submit"]');
    const release = holdForm(dialog, box, submit);
    try {
    await (submit ? busy(submit, () => setup.onSubmit(data, box), { done: false }) : setup.onSubmit(data, box));
    } catch {
    release();
    if (!dialog.isConnected) return;
    const speaker = part('toast');
    const region = speaker?.regionOfTheme(dialog.ownerDocument, dialog.closest('.ds-theme'), dialog.parentNode);
    if (region) speaker.toast(region, setup.errorText ?? t('actionFailed'), { kind: 'error' });
    if (canFocus(submit)) submit.focus({ preventScroll: true });
    return;
    }
    release();
    }
    close(dialog, { reason: 'submit' });
    });
    }
    function create(element) {
    return controllerOf(element);
    }
    const MODELESS = '.ds-dialog__box--modeless';
    function modelessOpened(box) {
    for (const body of box.querySelectorAll(':scope > .ds-dialog__body')) {
    const handle = watchScrolled(body);
    if (!body.querySelector(':scope > [data-ds-sentinel]')) handle.update();
    }
    const active = activeIn(box);
    if (active && box.contains(active)) return;
    const target = tabbables(box)[0];
    if (target) target.focus({ preventScroll: true });
    else {
    if (!box.hasAttribute('tabindex')) box.setAttribute('tabindex', '-1');
    box.focus({ preventScroll: true });
    }
    }
    define('dialog', {
    attribute: 'data-ds-dialog',
    init: (element) => create(element),
    global(root) {
    const onOpen = ( event) => {
    const box = (event.target);
    if (box?.matches?.(MODELESS)) modelessOpened(box);
    };
    root.addEventListener('ds:open', onOpen);
    return () => root.removeEventListener('ds:open', onOpen);
    },
    });
    internals.use('dialog', {
    confirm,
    alert,
    prompt,
    wire(dialog) {
    wireDialogList(dialog);
    wireForm(dialog);
    },
    });

    return Object.freeze({
      open: open,
      close: close,
      confirm: confirm,
      alert: alert,
      prompt: prompt,
      form: form,
      create: create
    });
  });

  add('form', ['count', 'counter'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, emit = DS.core.emit, t = DS.core.t;
    const autosize = DS.dom.autosize, own = DS.dom.own, disown = DS.dom.disown;
    const announce = DS.a11y.announce;
    const number = DS.format.number, plural = DS.format.plural;
    function count(value, max) {
    const length = String(value ?? '').length;
    const limit = Number.isFinite(Number(max)) && Number(max) >= 0 && max !== null && max !== '' ? Math.floor(Number(max)) : null;
    if (limit === null) return { length, max: null, remaining: null, over: false };
    return { length, max: limit, remaining: limit - length, over: length > limit };
    }
    function limitOf(field) {
    const hard = field.getAttribute?.('maxlength');
    if (hard !== null && hard !== undefined && hard !== '' && Number(hard) >= 0) return Number(hard);
    const soft = field.getAttribute?.('data-ds-counter-max');
    return soft !== null && soft !== undefined && soft !== '' && Number(soft) >= 0 ? Number(soft) : null;
    }
    function warnOf(field, max) {
    const given = Number(field.getAttribute?.('data-ds-counter-warn'));
    if (Number.isFinite(given) && given >= 0 && field.hasAttribute?.('data-ds-counter-warn')) return given;
    return Math.max(5, Math.round(max / 10));
    }
    function counterController(field, signal) {
    const doc = field.ownerDocument;
    const named = field.getAttribute?.('data-ds-counter');
    const output = ((named && doc?.getElementById?.(named)) || field.closest?.('.ds-field')?.querySelector('.ds-field__counter') || null);
    const listeners = new Set();
    let last = (null);
    let zone = 'calm';
    if (output) own(output, 'classes', 'ds-field__counter--over');
    const state = () => count(field.value, limitOf(field));
    const paint = (speak) => {
    const now = state();
    if (output) {
    const text = now.max === null ? number(now.length) : `${number(now.length)} / ${number(now.max)}`;
    if (output.textContent !== text) output.textContent = text;
    output.classList.toggle('ds-field__counter--over', now.over);
    }
    const next = now.max === null ? 'calm' : now.over ? 'over' : now.remaining <= warnOf(field, now.max) ? 'near' : 'calm';
    if (speak && next !== zone && next !== 'calm') {
    const amount = next === 'over' ? now.length - (now.max) : (now.remaining);
    announce(next === 'over'
    ? plural(amount, { one: t('charactersOverOne'), other: t('charactersOver') })
    : plural(amount, { one: t('charactersLeftOne'), other: t('charactersLeft') }));
    }
    zone = next;
    if (last && last.length === now.length && last.max === now.max) return;
    const changed = last !== null;
    last = now;
    if (!changed) return;
    emit(field, 'change', now);
    listeners.forEach((fn) => fn(now));
    };
    field.addEventListener?.('input', () => paint(true), { signal });
    field.form?.addEventListener('reset', () => setTimeout(() => paint(false)), { signal });
    doc?.addEventListener?.('ds:config', () => paint(false), { signal });
    paint(false);
    return {
    get() { return state(); },
    set(value) {
    field.value = String(value ?? '');
    paint(false);
    },
    on(type, fn) {
    if (type !== 'change') return () => {};
    listeners.add(fn);
    return () => listeners.delete(fn);
    },
    update() { paint(false); },
    destroy() {
    listeners.clear();
    if (output) disown(output, 'classes', 'ds-field__counter--over');
    },
    };
    }
    define('autosize', {
    selector: 'textarea.ds-input--grow',
    init(el) {
    const handle = autosize( (el));
    return { update: () => handle.update(), destroy: () => handle.destroy() };
    },
    });
    define('counter', {
    attribute: 'data-ds-counter',
    attributes: ['maxlength', 'data-ds-counter-max', 'data-ds-counter-warn'],
    init(el, ctx) {
    return counterController(el, ctx.signal);
    },
    });
    function counter(el) {
    const abort = typeof AbortController === 'function' ? new AbortController() : null;
    const made = counterController(el, abort?.signal ?? null);
    const destroy = made.destroy;
    made.destroy = () => {
    destroy();
    abort?.abort();
    };
    return made;
    }

    return Object.freeze({
      count: count,
      counter: counter
    });
  });

  add('formatted', ['text', 'exact', 'create'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, emit = DS.core.emit;
    const own = DS.dom.own, disown = DS.dom.disown;
    const number = DS.format.number, percent = DS.format.percent, currency = DS.format.currency, bytes = DS.format.bytes, duration = DS.format.duration;
    const KINDS = Object.freeze(['number', 'compact', 'percent', 'currency', 'bytes', 'duration']);
    const OPTION_ATTRIBUTES = Object.freeze(['currency', 'digits', 'base', 'style', 'signed', 'tip']);
    const EXACT_DIGITS = 6;
    function parse(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
    }
    function numberOptions(options) {
    const out = {};
    if (options.locale) out.locale = options.locale;
    if (options.signed) out.signDisplay = 'exceptZero';
    const digits = Number.parseInt(String(options.digits ?? ''), 10);
    if (Number.isInteger(digits) && digits >= 0 && digits <= 20) {
    out.maximumFractionDigits = digits;
    if (options.kind === 'currency') out.minimumFractionDigits = Math.min(digits, 2);
    }
    return out;
    }
    function text(value, options = {}) {
    const raw = parse(value);
    if (raw === null) return '';
    const kind = KINDS.includes(options.kind ?? '') ? options.kind : 'number';
    const settings = numberOptions({ ...options, kind });
    switch (kind) {
    case 'compact':
    return number(raw, { ...settings, notation: 'compact', compactDisplay: options.style === 'long' ? 'long' : 'short' });
    case 'percent':
    return percent(raw, { maximumFractionDigits: 1, ...settings });
    case 'currency':
    try {
    return currency(raw, String(options.currency || 'USD').toUpperCase(), settings);
    } catch {
    return number(raw, settings);
    }
    case 'bytes':
    return bytes(raw, { ...settings, base: Number(options.base) === 1024 ? 1024 : 1000 });
    case 'duration': {
    const style = ['short', 'long', 'narrow', 'clock'].includes(options.style ?? '') ? options.style : 'short';
    return duration(raw, { locale: options.locale, style });
    }
    default:
    return number(raw, settings);
    }
    }
    function exact(value, options = {}) {
    const raw = parse(value);
    if (raw === null) return '';
    const kind = KINDS.includes(options.kind ?? '') ? options.kind : 'number';
    const locale = { ...(options.locale ? { locale: options.locale } : {}), ...(options.signed ? { signDisplay: 'exceptZero' } : {}) };
    let full;
    if (kind === 'bytes') full = number(raw, { ...locale, signDisplay: 'auto', style: 'unit', unit: 'byte', unitDisplay: 'long', maximumFractionDigits: 0 });
    else if (kind === 'duration') full = duration(raw, { locale: options.locale, style: 'long', parts: 5 });
    else if (kind === 'percent') full = percent(raw, { ...locale, maximumFractionDigits: EXACT_DIGITS });
    else if (kind === 'currency') {
    try {
    full = currency(raw, String(options.currency || 'USD').toUpperCase(), { ...locale, maximumFractionDigits: Math.max(2, EXACT_DIGITS) });
    } catch {
    full = number(raw, { ...locale, maximumFractionDigits: EXACT_DIGITS });
    }
    } else full = number(raw, { ...locale, maximumFractionDigits: EXACT_DIGITS });
    return full === text(raw, options) ? '' : full;
    }
    function controller(el, given, signal) {
    const listeners = new Set();
    let live = true;
    let written = '';
    let wroteTip = false;
    let value = null;
    const setting = (name) => {
    if (given[name] !== undefined) return given[name];
    const attribute = `data-ds-format-${name}`;
    if (!el.hasAttribute(attribute)) return undefined;
    const read = el.getAttribute(attribute);
    return name === 'signed' ? read !== 'false' : read;
    };
    const settings = () => {
    const out = { kind: given.kind ?? el.getAttribute('data-ds-format') ?? 'number' };
    for (const name of OPTION_ATTRIBUTES) {
    const read = setting(name);
    if (read !== undefined && name !== 'tip') out[name] = read;
    }
    if (given.locale) out.locale = given.locale;
    return out;
    };
    const source = () => (el.hasAttribute('data-ds-value') ? el.getAttribute('data-ds-value') : value);
    const writeTip = (tip) => {
    const off = given.tip === false || setting('tip') === 'off';
    if (off || !tip) {
    if (wroteTip) {
    wroteTip = false;
    el.removeAttribute('data-tip');
    disown(el, 'attrs', 'data-tip');
    }
    return;
    }
    if (!wroteTip) {
    if (el.hasAttribute('data-tip')) return;
    wroteTip = true;
    own(el, 'attrs', 'data-tip');
    }
    if (el.getAttribute('data-tip') !== tip) el.setAttribute('data-tip', tip);
    };
    const render = () => {
    const current = settings();
    const raw = source();
    const next = text(raw, current);
    writeTip(exact(raw, current));
    if (parse(raw) === null) return false;
    if (el.textContent === next) {
    written = next;
    return false;
    }
    if (el.childNodes.length === 1 && el.firstChild.nodeType === 3) el.firstChild.nodeValue = next;
    else el.textContent = next;
    written = next;
    watcher?.takeRecords();
    for (const fn of [...listeners]) fn({ value: parse(raw), text: next });
    return true;
    };
    value = given.value !== undefined ? given.value : el.textContent;
    const View = el.ownerDocument?.defaultView ?? globalThis;
    const watcher = typeof View.MutationObserver === 'function' ? new View.MutationObserver(() => {
    if (!live) return;
    const shown = el.textContent;
    if (shown !== written && !el.hasAttribute('data-ds-value')) value = shown;
    render();
    }) : null;
    watcher?.observe(el, { childList: true, characterData: true, subtree: true });
    const relocale = ( event) => {
    if (event.detail?.changed?.includes('locale')) render();
    };
    el.ownerDocument?.addEventListener?.('ds:config', relocale, signal ? { signal } : undefined);
    render();
    return {
    get() {
    return { value: parse(source()), text: el.textContent ?? '' };
    },
    set(next) {
    if (el.hasAttribute('data-ds-value')) el.setAttribute('data-ds-value', next === null || next === undefined ? '' : String(next));
    value = next;
    if (render() && live) emit(el, 'change', { value: parse(next), text: written });
    },
    on(type, fn) {
    if (type !== 'change') return () => {};
    listeners.add(fn);
    return () => listeners.delete(fn);
    },
    update() {
    if (live) render();
    },
    destroy() {
    if (!live) return;
    live = false;
    watcher?.disconnect();
    el.ownerDocument?.removeEventListener?.('ds:config', relocale);
    listeners.clear();
    if (wroteTip) {
    wroteTip = false;
    el.removeAttribute('data-tip');
    disown(el, 'attrs', 'data-tip');
    }
    },
    };
    }
    define('formatted', {
    attribute: 'data-ds-format',
    attributes: ['data-ds-value', ...OPTION_ATTRIBUTES.map((name) => `data-ds-format-${name}`)],
    init(el, ctx) {
    return controller(el, {}, ctx.signal);
    },
    });
    function create(el, options = {}) {
    return controller(el, options, null);
    }

    return Object.freeze({
      text: text,
      exact: exact,
      create: create
    });
  });

  add('menu', ['open', 'openAt', 'close', 'create'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, emit = DS.core.emit, t = DS.core.t;
    const motionDuration = DS.motion.motionDuration, originFrom = DS.motion.originFrom, settled = DS.motion.settled;
    const computePlacement = DS.position.computePlacement, place = DS.position.place, pxOf = DS.position.pxOf, releaseAnchor = DS.position.releaseAnchor, round = DS.position.round, viewportBounds = DS.position.viewportBounds;
    const announce = DS.a11y.announce;
    const internals = DS.overlay.internals, openOverlay = DS.overlay.open, closeOverlay = DS.overlay.close, typeAhead = DS.overlay.typeAhead;
    const { overlays, stack, viewOf, canFocus, activeIn, inside, closeFrom, arrowTarget, placeMenu, controllerOf, clock, topOpen, flushStyle, own, disown, composedContains } = internals;
    function menuItems(menu) {
    return [...menu.querySelectorAll('.ds-menu__item')].filter((item) => item.closest('.ds-menu') === menu && canFocus(item));
    }
    const enabled = (item) => item.getAttribute('aria-disabled') !== 'true';
    function firstItem(menu) {
    return menuItems(menu).find(enabled) ?? null;
    }
    function searchOf(menu) {
    const field = menu.querySelector('.ds-menu__search input');
    return field && field.closest('.ds-menu') === menu ? (field) : null;
    }
    function subOf(item) {
    const popup = item?.getAttribute?.('aria-haspopup');
    if (popup !== 'menu' && popup !== 'true') return null;
    const id = item.getAttribute('aria-controls');
    if (!id) return null;
    const scope = item.getRootNode?.() ?? item.ownerDocument;
    const sub = scope.getElementById?.(id) ?? item.ownerDocument.getElementById(id);
    return sub?.matches('.ds-menu') ? sub : null;
    }
    const custom = new WeakMap();
    const unexpanded = new WeakMap();
    const focusMode = new WeakMap();
    function rootOf(menu) {
    let at = menu;
    for (let guard = 0; guard < 16; guard += 1) {
    const opener = overlays.get(at)?.opener;
    const parent = opener?.closest?.('.ds-menu');
    if (!parent || !custom.has(at) || custom.get(at)?.kind !== 'sub') return at;
    at = parent;
    }
    return at;
    }
    const isOpen = (element) => overlays.get(element)?.phase === 'open';
    const openSubsOf = (menu) => stack.filter((other) => custom.get(other)?.kind === 'sub' && isOpen(other) && overlays.get(other)?.opener?.closest?.('.ds-menu') === menu);
    const isTop = (element) => {
    try {
    return element.matches(':popover-open');
    } catch {
    return false;
    }
    };
    function placeAtPoint(menu, point, options) {
    const style = (menu).style;
    style.removeProperty('max-height');
    const size = { width: (menu).offsetWidth, height: (menu).offsetHeight };
    const rtl = viewOf(menu).getComputedStyle?.(menu).direction === 'rtl';
    const result = computePlacement({ left: point.x, right: point.x, top: point.y, bottom: point.y }, size, viewportBounds(menu), { ...options, rtl });
    if (size.height > result.room) style.setProperty('max-height', `${round(result.room)}px`);
    if (result.side === 'bottom') menu.removeAttribute('data-placement');
    else menu.setAttribute('data-placement', result.side);
    return result;
    }
    function placeCustom(menu) {
    const how = custom.get(menu);
    if (!how) return;
    const style = (menu).style;
    if (menu.hasAttribute('data-anchored')) {
    menu.removeAttribute('data-anchored');
    style.removeProperty('position-anchor');
    const state = overlays.get(menu);
    if (state?.anchor) {
    releaseAnchor(state.anchor);
    state.anchor = null;
    }
    }
    if (!isTop(menu) && typeof (menu).showPopover === 'function') {
    menu.setAttribute('popover', 'manual');
    try {
    (menu).showPopover();
    } catch {
    }
    }
    const padding = pxOf(menu, '--ds-space-2', 8);
    const result = how.kind === 'sub'
    ? place( (menu), (how.anchor), { side: 'end', align: 'start', offset: 0, padding, flip: 'room', size: false })
    : placeAtPoint(menu, (how.anchor), { side: 'bottom', align: 'start', offset: 0, padding, flip: 'room', crossFlip: true });
    if (!result) return;
    const lift = how.kind === 'sub' ? parseFloat(viewOf(menu).getComputedStyle(menu).paddingTop) || 0 : 0;
    const height = (menu).offsetHeight;
    const bottom = (menu.ownerDocument.documentElement.clientHeight || viewOf(menu).innerHeight) - padding;
    const y = Math.max(padding, Math.min(result.y - lift, bottom - height));
    style.setProperty('--ds-menu-x', `${round(result.x)}px`);
    style.setProperty('--ds-menu-y', `${round(y)}px`);
    if (result.side === 'bottom') menu.removeAttribute('data-placement');
    }
    function enterCustom(menu) {
    const how = custom.get(menu);
    if (!how) return;
    const style = (menu).style;
    style.setProperty('transition', 'none');
    style.setProperty('scale', 'none');
    menu.setAttribute('data-state', 'closed');
    placeCustom(menu);
    originFrom(how.kind === 'sub' ? (how.anchor) : how.anchor, menu);
    style.removeProperty('scale');
    flushStyle(menu);
    style.removeProperty('transition');
    menu.setAttribute('data-state', 'open');
    }
    const listening = new WeakSet();
    function listen(doc) {
    if (listening.has(doc)) return;
    listening.add(doc);
    doc.addEventListener('keydown', ( event) => {
    if (event.key !== 'Tab' || event.isComposing || event.defaultPrevented) return;
    const top = topOpen();
    if (!top || overlays.get(top)?.kind !== 'menu' || !top.contains(activeIn(top))) return;
    const root = rootOf(top);
    const opener = overlays.get(root)?.opener;
    if (canFocus(opener)) opener.focus({ preventScroll: true });
    closeChain(top, 'tab');
    }, true);
    doc.addEventListener('pointerdown', ( event) => {
    for (const element of [...stack].reverse()) {
    if (custom.get(element)?.kind !== 'point' || !isOpen(element) || inside(element, event)) continue;
    if (stack.slice(stack.indexOf(element) + 1).some((other) => isOpen(other) && inside(other, event))) continue;
    closeFrom(element, 'outside');
    }
    }, true);
    doc.addEventListener('ds:close', (event) => {
    const menu = (event.target);
    if (!menu?.matches?.('.ds-menu')) return;
    for (const sub of openSubsOf(menu)) closeFrom(sub, 'parent');
    const row = unexpanded.get(menu);
    if (row) {
    unexpanded.delete(menu);
    row.removeAttribute('aria-expanded');
    }
    const state = overlays.get(menu);
    state?.closing?.then(() => {
    if (state.phase === 'closed') custom.delete(menu);
    });
    });
    const view = doc.defaultView ?? globalThis;
    let frame = 0;
    const follow = ( event) => {
    if (event?.type === 'scroll' && (event.target)?.closest?.('.ds-menu')) return;
    if (frame || !stack.some((element) => overlays.get(element)?.kind === 'menu')) return;
    const run = () => {
    frame = 0;
    for (const element of stack) {
    const state = overlays.get(element);
    if (state?.kind !== 'menu' || state.phase === 'closed') continue;
    if (custom.has(element)) {
    if (custom.get(element)?.kind === 'sub') placeCustom(element);
    } else if (!element.hasAttribute('data-anchored')) placeMenu(element, state.opener);
    }
    };
    frame = typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(run) : 0;
    if (!frame) run();
    };
    doc.addEventListener('scroll', follow, { capture: true, passive: true });
    view.addEventListener?.('resize', follow);
    }
    function closeChain(menu, cause) {
    const chain = [];
    for (let at = menu; at; ) {
    chain.push(at);
    const how = custom.get(at);
    const opener = overlays.get(at)?.opener;
    at = how?.kind === 'sub' ? opener?.closest?.('.ds-menu') ?? null : null;
    if (chain.length > 16) break;
    }
    for (const element of chain) closeFrom(element, cause);
    }
    function flipCheck(menu, item) {
    if (!menu.hasAttribute('data-ds-menu-checks')) return;
    const role = item.getAttribute('role');
    if (role !== 'menuitemcheckbox' && role !== 'menuitemradio') return;
    const was = item.getAttribute('aria-checked') === 'true';
    if (role === 'menuitemradio' && was) return;
    const checked = role === 'menuitemradio' || !was;
    if (role === 'menuitemradio') {
    const group = item.closest('[role="group"]') ?? menu;
    for (const other of group.querySelectorAll('[role="menuitemradio"]')) {
    if (other.closest('.ds-menu') === menu) other.setAttribute('aria-checked', 'false');
    }
    }
    item.setAttribute('aria-checked', String(checked));
    emit(menu, 'change', { item, checked });
    }
    function openSub(item, mode) {
    const sub = subOf(item);
    const menu = item.closest('.ds-menu');
    if (!sub || !menu || !enabled(item)) return;
    for (const other of openSubsOf(menu)) if (other !== sub) closeFrom(other, 'parent');
    if (isOpen(sub) && overlays.get(sub)?.opener === item) {
    if (mode === 'first') firstItem(sub)?.focus({ preventScroll: true });
    return;
    }
    const reverse = overlays.get(sub)?.phase === 'closing' && overlays.get(sub)?.opener === item && custom.get(sub)?.anchor === item;
    custom.set(sub, { kind: 'sub', anchor: item });
    focusMode.set(sub, mode);
    openOverlay(sub, { opener: item });
    if (!reverse) enterCustom(sub);
    if (menu.getAnimations?.().some((animation) => animation.playState === 'running')) {
    settled(menu, { transitions: true }).then(() => {
    if (custom.get(sub)?.anchor === item && isOpen(sub)) placeCustom(sub);
    });
    }
    }
    function filter(menu, query) {
    const text = query.replace(/\s+/g, ' ').trim().toLowerCase();
    let shown = 0;
    for (const item of menu.querySelectorAll('.ds-menu__item')) {
    if (item.closest('.ds-menu') !== menu) continue;
    const words = (item.querySelector('.ds-menu__content') ?? item.querySelector('.ds-menu__label') ?? item).textContent.replace(/\s+/g, ' ').toLowerCase();
    const match = !text || words.includes(text);
    setHidden(item, !match);
    if (match) shown += 1;
    }
    for (const group of menu.querySelectorAll('[role="group"]')) {
    if (group.closest('.ds-menu') !== menu) continue;
    const any = [...group.querySelectorAll('.ds-menu__item')].some((item) => !item.hidden);
    setHidden(group, !any);
    }
    for (const divider of menu.querySelectorAll('.ds-menu__divider')) {
    if (divider.closest('.ds-menu') === menu) setHidden(divider, Boolean(text));
    }
    let empty = menu.querySelector('.ds-menu__empty');
    if (!shown && !empty) {
    empty = menu.ownerDocument.createElement('p');
    empty.className = 'ds-menu__empty';
    empty.setAttribute('role', 'none');
    empty.setAttribute('data-ds-keep', '');
    menu.append(empty);
    }
    if (empty) {
    if (!shown) empty.textContent = t('noResults');
    setHidden(empty, shown > 0);
    }
    if (!shown && text) {
    try {
    announce(t('noResults'));
    } catch {
    }
    }
    }
    function setHidden(node, value) {
    if (node.hidden === value) return;
    node.hidden = value;
    if (value) own(node, 'attrs', 'hidden');
    else disown(node, 'attrs', 'hidden');
    }
    function sideKeys(menu) {
    const rtl = viewOf(menu).getComputedStyle?.(menu).direction === 'rtl';
    return rtl ? { into: 'ArrowLeft', out: 'ArrowRight' } : { into: 'ArrowRight', out: 'ArrowLeft' };
    }
    function hoverIntent(menu) {
    let openTimer = (0);
    let closeTimer = (0);
    let pending = (null);
    const time = (token) => motionDuration(menu, token);
    const cancelOpen = () => {
    clearTimeout(openTimer);
    openTimer = 0;
    pending = null;
    };
    const cancelClose = () => {
    clearTimeout(closeTimer);
    closeTimer = 0;
    };
    menu.addEventListener('pointerover', ( event) => {
    if (event.pointerType === 'touch' || !isOpen(menu)) return;
    const target = (event.target);
    if (openSubsOf(menu).some((sub) => sub.contains(target))) {
    cancelClose();
    cancelOpen();
    return;
    }
    if (target.closest?.('.ds-menu') !== menu) return;
    const item = target.closest('.ds-menu__item');
    if (!item || item === pending) return;
    cancelOpen();
    const sub = subOf(item);
    const others = openSubsOf(menu).filter((other) => other !== sub);
    if (others.length && !closeTimer) {
    closeTimer = setTimeout(() => {
    closeTimer = 0;
    for (const other of openSubsOf(menu)) if (overlays.get(other)?.opener !== pending && overlays.get(other)?.opener !== item) closeFrom(other, 'parent');
    }, time('--ds-delay-submenu-close'));
    }
    if (sub && enabled(item) && !(isOpen(sub) && overlays.get(sub)?.opener === item)) {
    pending = item;
    openTimer = setTimeout(() => {
    openTimer = 0;
    pending = null;
    if (!isOpen(menu)) return;
    cancelClose();
    openSub(item, 'none');
    }, time('--ds-delay-submenu'));
    } else if (sub) cancelClose();
    });
    menu.addEventListener('pointerleave', () => cancelOpen());
    menu.addEventListener('click', () => cancelOpen(), true);
    menu.addEventListener('keydown', () => cancelOpen(), true);
    }
    function wireMenu(menu) {
    let typed = '';
    let typedAt = 0;
    menu.addEventListener('keydown', ( event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const target = (event.target);
    if (target?.closest?.('.ds-menu') !== menu) return;
    const items = menuItems(menu);
    const search = searchOf(menu);
    const keys = sideKeys(menu);
    const item = target.closest?.('.ds-menu__item');
    if (search && target === search) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    (event.key === 'ArrowDown' ? items[0] : items.at(-1))?.focus();
    } else if (event.key === 'Enter') {
    const first = items.find(enabled);
    if (!first) return;
    event.preventDefault();
    (first).click();
    }
    return;
    }
    if (item && event.key === keys.into && subOf(item)) {
    event.preventDefault();
    openSub(item, 'first');
    return;
    }
    if (event.key === keys.out && custom.get(menu)?.kind === 'sub') {
    event.preventDefault();
    closeOverlay(menu, { reason: 'collapse' });
    return;
    }
    if (search && ((event.key === 'ArrowUp' && item === items[0]) || (event.key === 'ArrowDown' && item === items.at(-1)))) {
    event.preventDefault();
    search.focus();
    return;
    }
    const next = arrowTarget(items, event);
    if (next) {
    typed = '';
    event.preventDefault();
    next.focus();
    return;
    }
    if (event.key.length !== 1 || (event.key === ' ' && !typed)) return;
    if (search) {
    event.preventDefault();
    search.focus();
    search.value += event.key;
    search.dispatchEvent(new (viewOf(menu).Event)('input', { bubbles: true }));
    return;
    }
    const now = clock();
    if (now - typedAt > motionDuration(menu, '--ds-delay-tooltip')) typed = '';
    typedAt = now;
    typed += event.key.toLowerCase();
    const match = typeAhead(items, item, typed);
    if (!match) return;
    event.preventDefault();
    match.focus();
    });
    menu.addEventListener('input', (event) => {
    const search = searchOf(menu);
    if (search && event.target === search) filter(menu, search.value);
    });
    menu.addEventListener('click', ( event) => {
    const item = (event.target)?.closest?.('.ds-menu__item');
    if (!item || item.closest('.ds-menu') !== menu || !enabled(item) || (item).disabled) return;
    const state = overlays.get(menu);
    if (state?.phase !== 'open') return;
    if (subOf(item)) {
    openSub(item, event.detail === 0 ? 'first' : 'none');
    return;
    }
    const gen = state.gen;
    flipCheck(menu, item);
    setTimeout(() => {
    if (state.gen === gen && state.phase === 'open') closeChain(menu, 'item');
    });
    });
    hoverIntent(menu);
    }
    function focusInto(menu) {
    const mode = focusMode.get(menu);
    focusMode.delete(menu);
    const search = searchOf(menu);
    if (search) {
    if (search.value) {
    search.value = '';
    filter(menu, '');
    }
    if (mode !== 'none') search.focus({ preventScroll: true });
    return;
    }
    if (mode === 'none') return;
    const event = (viewOf(menu)).event;
    const last = mode === 'last' || (event?.type === 'keydown' && event.key === 'ArrowUp');
    (last ? menuItems(menu).filter(enabled).at(-1) : firstItem(menu))?.focus({ preventScroll: true });
    }
    function open(element, options = {}) {
    custom.delete(element);
    return openOverlay(element, options);
    }
    function openAt(element, options = {}) {
    if (!element?.isConnected) return Promise.resolve();
    const opener = options.opener ?? activeIn(element) ?? null;
    const point = Number.isFinite(options.x) && Number.isFinite(options.y) ? { x: Number(options.x), y: Number(options.y) } : null;
    const expanded = opener?.getAttribute?.('aria-expanded') ?? null;
    const before = custom.get(element);
    const reverse = Boolean(point) && overlays.get(element)?.phase === 'closing' && overlays.get(element)?.opener === opener
    && before?.kind === 'point' && before.anchor.x === point.x && before.anchor.y === point.y;
    if (point) custom.set(element, { kind: 'point', anchor: point });
    else custom.delete(element);
    let entrance = openOverlay(element, { opener, returnTo: options.returnTo });
    if (point && !reverse) {
    enterCustom(element);
    entrance = settled(element, { transitions: true });
    }
    if (opener && (expanded === null || unexpanded.get(element) === opener)) {
    opener.removeAttribute('aria-expanded');
    unexpanded.set(element, opener);
    } else unexpanded.delete(element);
    return entrance;
    }
    function close(element, options = {}) {
    return closeOverlay(element, options);
    }
    function create(element) {
    return controllerOf(element);
    }
    define('menu', {
    attribute: 'data-ds-menu',
    init: (element) => create(element),
    });
    function contextMenuOf(target) {
    const value = target.getAttribute('data-ds-contextmenu') ?? '';
    if (!value) return null;
    const scope = target.getRootNode?.() ?? target.ownerDocument;
    let found = null;
    try {
    found = scope.querySelector(value);
    } catch {
    }
    found ??= scope.getElementById?.(value) ?? null;
    return found?.matches('.ds-menu') ? found : null;
    }
    const PRESS_SLOP_PX = 10;
    const handled = new WeakSet();
    define('contextmenu', {
    attribute: 'data-ds-contextmenu',
    global(root) {
    const doc = root.nodeType === 9 ? (root) : root.ownerDocument;
    if (!doc) return () => {};
    let press = (null);
    let swallow = (null);
    let keyOpen = { at: -Infinity, within: 0 };
    const targetOf = ( event) => ( (event.composedPath?.()[0] ?? event.target)?.closest?.('[data-ds-contextmenu]') ?? null);
    const show = (target, point) => {
    const menu = contextMenuOf(target);
    if (!menu) return false;
    const rect = target.getBoundingClientRect();
    const at = point ?? { x: rect.left, y: rect.bottom };
    if (!emit(target, 'contextmenu', { menu, x: at.x, y: at.y }, { cancelable: true })) return false;
    const active = activeIn(target);
    const opener = active && target.contains(active) && active !== doc.body ? active : target;
    openAt(menu, { x: at.x, y: at.y, opener });
    return true;
    };
    const unswallow = () => {
    if (!swallow) return;
    doc.removeEventListener('click', swallow, true);
    doc.removeEventListener('contextmenu', swallow, true);
    swallow = null;
    };
    const cancelPress = () => {
    if (press) clearTimeout(press.timer);
    press = null;
    };
    const onContextMenu = ( event) => {
    if (handled.has(event)) return;
    handled.add(event);
    if (event.defaultPrevented) return;
    if (clock() - keyOpen.at < keyOpen.within) {
    keyOpen = { at: -Infinity, within: 0 };
    event.preventDefault();
    return;
    }
    const target = targetOf(event);
    if (!target) return;
    cancelPress();
    const keyboard = event.button !== 2 && event.clientX === 0 && event.clientY === 0;
    if (show(target, keyboard ? null : { x: event.clientX, y: event.clientY })) event.preventDefault();
    };
    const onKeyDown = ( event) => {
    if (handled.has(event)) return;
    handled.add(event);
    const contextKey = event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey);
    if (!contextKey || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = targetOf(event);
    if (!target || !show(target, null)) return;
    keyOpen = { at: clock(), within: motionDuration(target, '--ds-delay-dismiss') };
    event.preventDefault();
    };
    const onPointerDown = ( event) => {
    unswallow();
    cancelPress();
    if (event.pointerType !== 'touch' || handled.has(event)) return;
    handled.add(event);
    const target = targetOf(event);
    if (!target || !contextMenuOf(target)) return;
    const x = event.clientX;
    const y = event.clientY;
    press = { target, id: event.pointerId, x, y, timer: 0 };
    press.timer = setTimeout(() => {
    if (!press || press.target !== target) return;
    press = null;
    if (!show(target, { x, y })) return;
    swallow = ( next) => {
    next.preventDefault();
    next.stopImmediatePropagation();
    if (next.type === 'click') unswallow();
    };
    doc.addEventListener('click', swallow, true);
    doc.addEventListener('contextmenu', swallow, true);
    }, motionDuration(target, '--ds-delay-long-press'));
    };
    const onPointerMove = ( event) => {
    if (!press || event.pointerId !== press.id) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > PRESS_SLOP_PX) cancelPress();
    };
    const onPointerEnd = ( event) => {
    if (press && event.pointerId === press.id) cancelPress();
    };
    root.addEventListener('contextmenu', onContextMenu);
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerup', onPointerEnd);
    root.addEventListener('pointercancel', onPointerEnd);
    return () => {
    cancelPress();
    unswallow();
    root.removeEventListener('contextmenu', onContextMenu);
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('pointerdown', onPointerDown);
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerup', onPointerEnd);
    root.removeEventListener('pointercancel', onPointerEnd);
    };
    },
    });
    internals.use('menu', {
    focusInto,
    wire(menu) {
    listen(menu.ownerDocument);
    wireMenu(menu);
    },
    });

    return Object.freeze({
      open: open,
      openAt: openAt,
      close: close,
      create: create
    });
  });

  add('page', ['fold', 'create'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, emit = DS.core.emit, t = DS.core.t;
    const own = DS.dom.own, disown = DS.dom.disown;
    const iconElement = DS.icons.iconElement, moreVertical = DS.icons.moreVertical;
    const openMenu = DS.menu.open, closeMenu = DS.menu.close;
    let serial = 0;
    const TOP = 1;
    function fold(widths, options) {
    const { room, gap = 0, more = 0, order = widths.map((_, index) => index) } = options;
    const need = (kept, withMore) => {
    const parts = kept.map((index) => widths[index]);
    if (withMore) parts.push(more);
    return parts.length ? parts.reduce((sum, width) => sum + width, 0) + gap * (parts.length - 1) : 0;
    };
    const all = widths.map((_, index) => index);
    if (need(all, false) <= room) return [];
    const folded = new Set();
    for (const index of order) {
    folded.add(index);
    if (need(all.filter((each) => !folded.has(each)), true) <= room) break;
    }
    return [...folded].sort((a, b) => a - b);
    }
    function scrolls(element, view) {
    const style = view.getComputedStyle(element);
    return /(auto|scroll|overlay)/.test(style.overflowY) && element.scrollHeight > element.clientHeight;
    }
    function scrollerOf(element, view) {
    const doc = element.ownerDocument;
    for (let node = element.parentElement; node && node !== doc.body && node !== doc.documentElement; node = node.parentElement) {
    if (scrolls(node, view)) return node;
    }
    return null;
    }
    function labelOf(action) {
    const copy = action.cloneNode(true);
    for (const part of copy.querySelectorAll('svg, .ds-sr, .ds-badge')) part.remove();
    return copy.textContent.trim() || action.getAttribute('aria-label') || action.getAttribute('data-tip') || action.getAttribute('title') || '';
    }
    function controller(head, options, signal) {
    const doc = head.ownerDocument;
    const view = doc.defaultView ?? globalThis;
    const abort = new AbortController();
    const listen = { signal: abort.signal };
    signal?.addEventListener('abort', () => abort.abort(), { once: true });
    const listeners = new Set();
    const owned = [];
    const take = (element, name) => {
    if (owned.some(([each, which]) => each === element && which === name)) return;
    own(element, 'attrs', name);
    owned.push([element, name]);
    };
    const sticky = options.condense !== false && head.classList.contains('ds-page-head--sticky');
    const scroller = sticky ? scrollerOf(head, view) : null;
    const box = () => scroller ?? doc.scrollingElement ?? doc.documentElement;
    let condensed = head.hasAttribute('data-scrolled');
    let foldHeight = 0;
    let offset = 0;
    if (sticky) {
    take(head, 'data-scrolled');
    take(head, 'style');
    }
    const quiet = (fn) => {
    const target = scroller ?? doc.documentElement;
    const before = target.style.overflowAnchor;
    target.style.overflowAnchor = 'none';
    try {
    fn();
    } finally {
    target.style.overflowAnchor = before;
    }
    };
    const apply = (on, fold = 0) => {
    if (on) {
    head.setAttribute('data-scrolled', '');
    head.style.setProperty('--ds-page-head-fold', `${fold}px`);
    } else {
    head.removeAttribute('data-scrolled');
    head.style.removeProperty('--ds-page-head-fold');
    }
    };
    const measureFold = () => {
    if (!sticky || condensed) return;
    const start = box().scrollTop;
    const settling = !head.hasAttribute('data-ds-moving');
    if (settling) head.setAttribute('data-ds-moving', '');
    const scrolling = box();
    const anchor = scrolling.style.overflowAnchor;
    scrolling.style.overflowAnchor = 'none';
    quiet(() => {
    const before = head.style.position;
    head.style.position = 'static';
    const place = head.getBoundingClientRect().top;
    head.style.position = before;
    const stick = parseFloat(view.getComputedStyle(head).top) || 0;
    const origin = scroller ? scroller.getBoundingClientRect().top + scroller.clientTop : 0;
    offset = Math.max(0, Math.round(place - origin + start - stick));
    const tall = head.getBoundingClientRect().height;
    apply(true);
    foldHeight = Math.max(0, tall - head.getBoundingClientRect().height);
    apply(false);
    });
    if (settling) {
    void view.getComputedStyle(head).opacity;
    head.removeAttribute('data-ds-moving');
    }
    scrolling.style.overflowAnchor = anchor;
    if (Math.abs(box().scrollTop - start) >= 1) box().scrollTop = start;
    };
    const condense = (on, force = false) => {
    if (on === condensed) return false;
    if (on) {
    if (!force && box().scrollTop <= offset + foldHeight + TOP) return false;
    quiet(() => {
    const tall = head.getBoundingClientRect().height;
    apply(true, foldHeight);
    const fold = Math.max(0, tall - head.getBoundingClientRect().height);
    if (Math.abs(fold - foldHeight) > 0.01) {
    foldHeight = fold;
    apply(true, fold);
    }
    });
    } else quiet(() => apply(false));
    condensed = on;
    layout();
    const detail = { condensed: on };
    emit(head, 'change', detail);
    for (const fn of listeners) fn(detail);
    return true;
    };
    let frame = 0;
    const update = () => {
    frame = 0;
    if (!sticky) return;
    const top = box().scrollTop;
    if (!condensed && top > offset + foldHeight + TOP) condense(true);
    else if (condensed && top <= offset + foldHeight) condense(false);
    };
    const later = () => {
    if (frame) return;
    frame = typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(update) : 0;
    if (!frame) update();
    };
    if (sticky) (scroller ?? view).addEventListener('scroll', later, { passive: true, signal: abort.signal });
    let folds = 0;
    const heads = sticky && typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(() => {
    if (condensed || folds) return;
    folds = typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(() => { folds = 0; measureFold(); update(); }) : 0;
    }) : null;
    heads?.observe(head);
    measureFold();
    const actions = head.querySelector('.ds-page-head__actions');
    const row = actions?.closest('.ds-page-head__row') ?? actions?.parentElement ?? null;
    const folded = new Set();
    const itemsOf = new WeakMap();
    let more = null;
    let menu = null;
    const actionList = () => (actions ? [...actions.children].filter((child) => child !== more && child !== menu && !child.classList.contains('ds-menu')) : []);
    if (actions) {
    serial += 1;
    const menuId = `ds-page-more-${serial}`;
    more = doc.createElement('button');
    more.className = 'ds-btn ds-btn--quiet ds-btn--icon ds-page-head__more';
    more.type = 'button';
    more.hidden = true;
    more.setAttribute('aria-haspopup', 'menu');
    more.setAttribute('aria-expanded', 'false');
    more.setAttribute('aria-controls', menuId);
    more.setAttribute('aria-label', t('moreActions'));
    more.setAttribute('data-tip', t('moreActions'));
    more.dataset.dsKeep = '';
    more.append(iconElement(moreVertical, 20, '', doc));
    menu = doc.createElement('div');
    menu.className = 'ds-menu';
    menu.id = menuId;
    menu.hidden = true;
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('moreActions'));
    menu.dataset.dsKeep = '';
    actions.append(more, menu);
    more.addEventListener('click', (event) => {
    if (event.detail > 1) return;
    if (more.getAttribute('aria-expanded') === 'true') closeMenu(menu);
    else openMenu(menu, { opener: more });
    }, listen);
    more.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openMenu(menu, { opener: more });
    }, listen);
    menu.addEventListener('click', (event) => {
    const item = (event.target)?.closest?.('.ds-menu__item');
    const action = item ? itemsOf.get(item) : null;
    if (!action || item.getAttribute('aria-disabled') === 'true') return;
    if (item.tagName === 'A') {
    closeMenu(menu);
    return;
    }
    closeMenu(menu);
    action.click();
    }, listen);
    }
    const fillMenu = (list) => {
    if (!menu) return;
    const items = list.map((action) => {
    const link = action.tagName === 'A' && action.hasAttribute('href');
    const item = doc.createElement(link ? 'a' : 'button');
    item.className = 'ds-menu__item';
    item.setAttribute('role', 'menuitem');
    if (link) {
    item.setAttribute('href', action.getAttribute('href'));
    for (const name of ['target', 'rel', 'download']) if (action.hasAttribute(name)) item.setAttribute(name, action.getAttribute(name));
    } else item.type = 'button';
    if (action.matches(':disabled') || action.getAttribute('aria-disabled') === 'true' || action.getAttribute('aria-busy') === 'true') item.setAttribute('aria-disabled', 'true');
    const glyph = action.querySelector(':scope > svg');
    if (glyph) item.append(glyph.cloneNode(true));
    const label = doc.createElement('span');
    label.className = 'ds-menu__label';
    label.textContent = labelOf(action);
    item.append(label);
    itemsOf.set(item, action);
    return item;
    });
    menu.replaceChildren(...items);
    };
    function layout() {
    if (!more || !actions.isConnected || !row) return;
    for (const action of folded) action.hidden = false;
    folded.clear();
    more.hidden = true;
    const all = actionList().filter((action) => !action.hidden);
    const style = view.getComputedStyle(actions);
    const gap = parseFloat(style.columnGap) || 0;
    const widths = all.map((action) => action.getBoundingClientRect().width);
    more.hidden = false;
    const moreWidth = more.getBoundingClientRect().width;
    more.hidden = true;
    const order = all.map((_, index) => index).sort((a, b) => Number(all[a].classList.contains('ds-btn--filled')) - Number(all[b].classList.contains('ds-btn--filled')) || a - b);
    const out = fold(widths, { room: condensed ? row.clientWidth / 2 : row.clientWidth, gap, more: moreWidth, order });
    if (!out.length) {
    fillMenu([]);
    if (more.getAttribute('aria-expanded') === 'true') closeMenu(menu);
    return;
    }
    const list = [];
    for (const index of out) {
    const action = all[index];
    take(action, 'hidden');
    action.hidden = true;
    folded.add(action);
    list.push(action);
    }
    more.hidden = false;
    fillMenu(list);
    }
    let layoutFrame = 0;
    const relayout = () => {
    if (layoutFrame) return;
    layoutFrame = typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(() => { layoutFrame = 0; layout(); }) : 0;
    if (!layoutFrame) layout();
    };
    const resize = more && typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(() => layout()) : null;
    resize?.observe(row);
    const helper = (node) => node === menu || node === more || (node.nodeType === 1 && (node).hasAttribute('data-ds-keep') && (node).getAttribute('aria-hidden') === 'true');
    const helpersOnly = (record) => record.type === 'childList' && [...record.addedNodes, ...record.removedNodes].every(helper);
    const changes = more && typeof view.MutationObserver === 'function' ? new view.MutationObserver((records) => {
    if (records.every((record) => record.target === menu || menu.contains(record.target) || record.target === more || helpersOnly(record))) return;
    relayout();
    }) : null;
    changes?.observe(actions, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'aria-label'] });
    layout();
    doc.fonts?.ready?.then(() => { if (!abort.signal.aborted) layout(); });
    update();
    let gone = false;
    return {
    get() {
    return condensed;
    },
    set(value) {
    if (sticky) condense(Boolean(value), true);
    },
    on(type, fn) {
    if (type !== 'change') return () => {};
    listeners.add(fn);
    return () => listeners.delete(fn);
    },
    refresh() {
    layout();
    measureFold();
    update();
    },
    destroy() {
    if (gone) return;
    gone = true;
    abort.abort();
    listeners.clear();
    resize?.disconnect();
    changes?.disconnect();
    heads?.disconnect();
    if (folds) view.cancelAnimationFrame?.(folds);
    if (frame) view.cancelAnimationFrame?.(frame);
    if (layoutFrame) view.cancelAnimationFrame?.(layoutFrame);
    for (const action of folded) action.hidden = false;
    folded.clear();
    if (menu && more?.getAttribute('aria-expanded') === 'true') closeMenu(menu);
    more?.remove();
    menu?.remove();
    for (const [element, name] of owned) disown(element, 'attrs', name);
    owned.length = 0;
    },
    };
    }
    define('page', {
    attribute: 'data-ds-page-head',
    attributes: ['data-ds-page-head-condense'],
    init(el, ctx) {
    return controller( (el), { condense: el.getAttribute('data-ds-page-head-condense') !== 'off' }, ctx.signal);
    },
    });
    function create(el, options = {}) {
    return controller(el, { condense: options.condense !== false });
    }

    return Object.freeze({
      fold: fold,
      create: create
    });
  });

  add('steps', ['position', 'create'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, emit = DS.core.emit, t = DS.core.t;
    const own = DS.dom.own, disown = DS.dom.disown;
    const announce = DS.a11y.announce;
    function position(index, total, label) {
    const at = Math.min(Math.max(0, Math.trunc(index)), Math.max(0, total - 1));
    return { position: total ? at + 1 : 0, total, label: label.trim() };
    }
    function stepsOf(list) {
    return [...list.children].filter((child) => child.classList.contains('ds-steps__step'));
    }
    function labelOf(step) {
    const label = step.querySelector('.ds-steps__label');
    if (!label) return '';
    const copy = label.cloneNode(true);
    for (const part of copy.querySelectorAll('.ds-sr')) part.remove();
    return copy.textContent.trim();
    }
    function carrier(step) {
    return step.querySelector(':scope > .ds-steps__link') ?? step;
    }
    function controller(list, signal) {
    const abort = new AbortController();
    signal?.addEventListener('abort', () => abort.abort(), { once: true });
    const listeners = new Set();
    const owned = new Set();
    const take = (element) => {
    if (owned.has(element)) return;
    own(element, 'attrs', 'aria-current');
    owned.add(element);
    };
    const current = () => stepsOf(list).findIndex((step) => {
    const value = carrier(step).getAttribute('aria-current') ?? step.getAttribute('aria-current');
    return value !== null && value !== 'false';
    });
    const select = (index, how = {}) => {
    const steps = stepsOf(list);
    if (!Number.isInteger(index) || index < 0 || index >= steps.length) return false;
    const previous = current();
    if (previous === index) return false;
    steps.forEach((step, at) => {
    for (const element of new Set([step, carrier(step)])) {
    take(element);
    if (at === index && element === carrier(step)) element.setAttribute('aria-current', 'step');
    else element.removeAttribute('aria-current');
    }
    });
    if (how.announce !== false) {
    const at = position(index, steps.length, labelOf(steps[index]));
    announce(t('stepOf', { step: at.position, total: at.total, label: at.label }));
    }
    for (const entry of listeners) entry({ index, step: steps[index], previous });
    return true;
    };
    list.addEventListener('click', (event) => {
    const link = (event.target)?.closest?.('.ds-steps__link');
    if (!link || !list.contains(link) || link.getAttribute('aria-disabled') === 'true') return;
    const step = link.closest('.ds-steps__step');
    const steps = stepsOf(list);
    const index = steps.indexOf(step);
    if (index < 0) return;
    const previous = current();
    if (index === previous) return;
    const navigates = link.tagName === 'A' && link.hasAttribute('href');
    const go = emit(list, 'change', { index, step, previous }, { cancelable: !navigates });
    if (navigates || !go) return;
    select(index);
    }, { signal: abort.signal });
    let gone = false;
    return {
    get() {
    return current();
    },
    set(value) {
    return select(Number(value));
    },
    on(type, fn) {
    if (type !== 'change') return () => {};
    listeners.add(fn);
    return () => listeners.delete(fn);
    },
    destroy() {
    if (gone) return;
    gone = true;
    abort.abort();
    listeners.clear();
    for (const element of owned) disown(element, 'attrs', 'aria-current');
    owned.clear();
    },
    };
    }
    define('steps', {
    attribute: 'data-ds-steps',
    init(el, ctx) {
    return controller( (el), ctx.signal);
    },
    });
    function create(el) {
    return controller(el);
    }

    return Object.freeze({
      position: position,
      create: create
    });
  });

  add('toast', ['toastRegion', 'announce', 'toast', 'closeToasts', 'promise', 'progress'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const t = DS.core.t;
    const flip = DS.motion.flip, settled = DS.motion.settled;
    const alertCircle = DS.icons.alertCircle, checkCircle = DS.icons.checkCircle, closeGlyph = DS.icons.close, iconElement = DS.icons.iconElement, info = DS.icons.info;
    const setShare = DS.dom.progress;
    const percent = DS.format.percent;
    const pxOf = DS.position.pxOf, round = DS.position.round;
    const internals = DS.overlay.internals, TOAST_LIMIT = DS.overlay.TOAST_LIMIT, TOAST_MAX_MS = DS.overlay.TOAST_MAX_MS, TOAST_MS = DS.overlay.TOAST_MS;
    const { overlays, stack, neverInert, shownSavebars, LANDMARK, activeIn, inside, own, disown, viewOf, flushStyle, canFocus, report, keepAway, keepHome, clock, normalText, timeScaleOf, nextFrame } = internals;
    const TOAST_CHAR_MS = 50;
    const TOAST_FREE_CHARS = 40;
    const PHONE_QUERY = '(max-width: 600px)';
    const toastRegions = new WeakMap();
    const toastEntries = new WeakMap();
    const pointedRegions = (new Set());
    const pointerWatched = new WeakSet();
    const visibilityRegions = new WeakMap();
    const drawerRegions = new WeakMap();
    const toastHomes = new WeakMap();
    const hostedRegions = new Map();
    const followRuns = new WeakMap();
    function regionState(region) {
    let state = toastRegions.get(region);
    if (!state) {
    state = {
    shown: [], queue: [], pointer: false, focus: false, origin: null,
    polite: null, assertive: null, pending: new Map(),
    reserved: null, observer: null, lifted: false, expanded: false,
    };
    toastRegions.set(region, state);
    for (const name of ['role', 'aria-live']) {
    if (!region.hasAttribute(name)) continue;
    region.removeAttribute(name);
    own(region, 'attrs', name);
    }
    wireRegion(region, state);
    hostLate(region);
    }
    return state;
    }
    function hostLate(region) {
    const theme = region.closest?.('.ds-theme') ?? null;
    for (const host of [...stack]) {
    const state = overlays.get(host);
    if (state?.phase !== 'open' || (state.kind !== 'dialog' && state.kind !== 'sheet')) continue;
    const hostTheme = host.closest('.ds-theme');
    if (hostTheme && hostTheme !== theme) continue;
    followInto(region, host);
    }
    }
    function appOf(region) {
    const scope = region.closest?.('.ds-theme') ?? region.ownerDocument;
    return (scope?.querySelector?.('.ds-app') ?? null);
    }
    const paused = (region, state) => state.pointer || state.focus || state.expanded || Boolean(region.ownerDocument.hidden);
    function limitOf(region) {
    const given = Number.parseInt(region.getAttribute?.('data-ds-toast-limit') ?? '', 10);
    return Number.isInteger(given) ? Math.min(5, Math.max(1, given)) : TOAST_LIMIT;
    }
    const stacks = (region) => Boolean(region.classList?.contains('ds-toasts--stack'));
    function arm(entry, region, state) {
    if (entry.stays || entry.phase !== 'shown' || entry.timer || paused(region, state)) return;
    entry.started = clock();
    entry.timer = setTimeout(() => {
    entry.timer = 0;
    closeToast(entry);
    }, Math.max(0, entry.remaining));
    }
    function disarm(entry) {
    if (!entry.timer) return;
    clearTimeout(entry.timer);
    entry.timer = 0;
    entry.remaining -= clock() - entry.started;
    }
    function pauseToasts(state) {
    for (const entry of state.shown) disarm(entry);
    }
    function resumeToasts(region, state) {
    for (const entry of state.shown) arm(entry, region, state);
    }
    function unpoint(region, state) {
    pointedRegions.delete(region);
    if (!state.pointer) return;
    state.pointer = false;
    resumeToasts(region, state);
    }
    function wireRegion(region, state) {
    const doc = region.ownerDocument;
    region.addEventListener('pointerover', ( event) => {
    if (state.pointer || region.contains( (event.relatedTarget))) return;
    state.pointer = true;
    pointedRegions.add(region);
    pauseToasts(state);
    });
    region.addEventListener('pointerout', ( event) => {
    if (region.contains( (event.relatedTarget))) return;
    unpoint(region, state);
    });
    region.addEventListener('focusin', ( event) => {
    const from = (event.relatedTarget);
    if (!state.focus && from && !region.contains(from)) state.origin = from;
    state.focus = true;
    pauseToasts(state);
    expandStack(region, state, true);
    });
    region.addEventListener('focusout', ( event) => {
    if (region.contains( (event.relatedTarget))) return;
    state.focus = false;
    if (!state.pointer) expandStack(region, state, false);
    resumeToasts(region, state);
    });
    region.addEventListener('click', ( event) => {
    const target = (event.target);
    if (!state.expanded && stacks(region) && target.closest?.('.ds-toast') && !target.closest('button, a[href], input, select, textarea')) {
    expandStack(region, state, true);
    return;
    }
    const button = target.closest?.('.ds-toast__close, .ds-toast__action');
    const entry = button && region.contains(button) ? toastEntries.get(button.closest('.ds-toast')) : null;
    if (!entry || entry.phase !== 'shown') return;
    if (button.classList.contains('ds-toast__close')) {
    closeToast(entry);
    return;
    }
    const run = entry.onAction;
    if (!run) return;
    entry.onAction = null;
    closeToast(entry);
    try {
    run(event, entry.handle);
    } catch (error) {
    report(region, error);
    }
    });
    const regions = visibilityOf(doc);
    for (const ref of [...regions]) if (!ref.deref()) regions.delete(ref);
    regions.add(new WeakRef(region));
    watchPointer(doc);
    watchPresses(doc);
    const app = appOf(region);
    const lifted = app ? drawerOf(app) : null;
    if (lifted) {
    for (const ref of [...lifted]) if (!ref.deref()) lifted.delete(ref);
    lifted.add(new WeakRef(region));
    }
    }
    function drawerOf(app) {
    let watched = drawerRegions.get(app);
    if (watched) return watched;
    const Observer = viewOf(app).MutationObserver;
    if (typeof Observer !== 'function') return null;
    const regions = (new Set());
    drawerRegions.set(app, regions);
    new Observer(() => {
    for (const ref of [...regions]) {
    const region = ref.deref();
    const state = region && toastRegions.get(region);
    if (!state) regions.delete(ref);
    else if (region.isConnected && state.shown.length) liftRegion(region);
    }
    }).observe(app, { attributes: true, attributeFilter: ['data-drawer-open'] });
    return regions;
    }
    function watchPointer(doc) {
    if (pointerWatched.has(doc)) return;
    pointerWatched.add(doc);
    doc.addEventListener('pointerover', ( event) => {
    for (const pointed of [...pointedRegions]) {
    if (!inside(pointed, event)) unpoint(pointed, toastRegions.get(pointed));
    }
    }, true);
    }
    const pressWatched = new WeakSet();
    const expandedRegions = (new Set());
    function watchPresses(doc) {
    if (pressWatched.has(doc)) return;
    pressWatched.add(doc);
    doc.addEventListener('pointerdown', ( event) => {
    for (const region of [...expandedRegions]) {
    const state = toastRegions.get(region);
    if (!state || !region.isConnected) expandedRegions.delete(region);
    else if (!inside(region, event)) expandStack(region, state, false);
    }
    }, true);
    }
    function expandStack(region, state, on) {
    const next = on && stacks(region) && state.shown.filter((entry) => entry.phase === 'shown').length > 1;
    if (next === state.expanded) return;
    state.expanded = next;
    if (next) expandedRegions.add(region);
    else expandedRegions.delete(region);
    flip(region, () => {
    region.toggleAttribute('data-expanded', next);
    stackFront(region, state);
    }).then(() => reserveRoom(region, state));
    if (next) pauseToasts(state);
    else resumeToasts(region, state);
    }
    function stackFront(region, state) {
    const style = (region).style;
    if (!stacks(region)) {
    if (style.getPropertyValue('--ds-toast-front')) style.removeProperty('--ds-toast-front');
    return;
    }
    const front = [...state.shown].reverse().find((entry) => entry.phase === 'shown' && entry.el.parentNode === region);
    if (!front) {
    style.removeProperty('--ds-toast-front');
    return;
    }
    style.setProperty('--ds-toast-front', `${Math.ceil( (front.el).offsetHeight)}px`);
    }
    function visibilityOf(doc) {
    let watched = visibilityRegions.get(doc);
    if (watched) return watched;
    const regions = (new Set());
    visibilityRegions.set(doc, regions);
    doc.addEventListener('visibilitychange', () => {
    for (const ref of [...regions]) {
    const region = ref.deref();
    const state = region && toastRegions.get(region);
    if (!state) regions.delete(ref);
    else if (doc.hidden) pauseToasts(state);
    else resumeToasts(region, state);
    }
    });
    return regions;
    }
    function closeButton(doc, label) {
    const button = doc.createElement('button');
    button.className = 'ds-btn ds-btn--quiet ds-btn--icon ds-toast__close';
    button.type = 'button';
    const name = label || t('close');
    button.setAttribute('aria-label', name);
    button.setAttribute('data-tip', name);
    button.append(iconElement(closeGlyph, 20, undefined, doc));
    return button;
    }
    function buildToast(doc, text, kind, closable, closeLabel, actionLabel) {
    const el = doc.createElement('div');
    el.className = kind === 'error' || kind === 'info' ? `ds-toast ds-toast--${kind}` : 'ds-toast';
    el.append(iconElement(kind === 'error' ? alertCircle : kind === 'info' ? info : checkCircle, 20, undefined, doc));
    const span = doc.createElement('span');
    span.className = 'ds-toast__text';
    span.textContent = text;
    el.append(span);
    if (actionLabel) {
    const action = doc.createElement('button');
    action.className = 'ds-btn ds-btn--text ds-sm ds-toast__action';
    action.type = 'button';
    action.textContent = actionLabel;
    el.append(action);
    }
    if (closable) el.append(closeButton(doc, closeLabel));
    return el;
    }
    function announcers(region, state) {
    const live = (key) => {
    const node = state[key];
    return Boolean(node?.isConnected) && node.classList.contains('ds-sr') && node.getAttribute('aria-live') === key;
    };
    if (live('polite') && live('assertive')) return;
    const doc = region.ownerDocument;
    for (const key of (['polite', 'assertive'])) {
    if (live(key)) continue;
    if (state[key]) neverInert.delete(state[key]);
    const node = doc.createElement('div');
    node.className = 'ds-sr';
    node.setAttribute('aria-live', key);
    node.setAttribute('aria-atomic', 'true');
    node.setAttribute('data-ds-keep', '');
    neverInert.add(node);
    state[key] = node;
    }
    region.after( (state.polite), (state.assertive));
    }
    function speak(region, state, entry) {
    if (!entry.text) return;
    announcers(region, state);
    const node = (entry.assertive ? state.assertive : state.polite);
    const texts = state.pending.get(node);
    if (texts) {
    const at = entry.key ? texts.findIndex((item) => item.key === entry.key) : -1;
    if (at >= 0) texts.splice(at, 1);
    texts.push({ text: entry.text, key: entry.key });
    return;
    }
    state.pending.set(node, [{ text: entry.text, key: entry.key }]);
    node.textContent = '';
    nextFrame(region.ownerDocument, () => {
    node.textContent = (state.pending.get(node) ?? []).map((item) => item.text).join('\n');
    state.pending.delete(node);
    });
    }
    function toastTimeout(region, text, options) {
    const given = typeof options.timeout === 'number' && options.timeout > 0 ? options.timeout : 0;
    const base = given || Math.min(TOAST_MAX_MS, TOAST_MS + TOAST_CHAR_MS * Math.max(0, text.length - TOAST_FREE_CHARS));
    return base * timeScaleOf(region);
    }
    function toastRegion(doc = globalThis.document) {
    if (!doc?.querySelector) return null;
    const app = doc.querySelector('.ds-app');
    const theme = app?.closest('.ds-theme') ?? null;
    const found = (theme && ownOf(theme, '.ds-toasts')) ?? doc.querySelector('.ds-toasts');
    if (found) return (found);
    return newRegion(doc, app, doc.querySelector('.ds-theme') ?? doc.body);
    }
    function ownOf(theme, selector) {
    return [...theme.querySelectorAll(selector)].find((node) => node.closest('.ds-theme') === theme) ?? null;
    }
    function newRegion(doc, app, parent) {
    const region = doc.createElement('div');
    region.className = 'ds-toasts';
    if (app) app.after(region);
    else (parent === doc.documentElement && doc.body ? doc.body : parent)?.append(region);
    return region.isConnected ? region : null;
    }
    function regionOfTheme(doc, theme, home) {
    if (!theme) return toastRegion(doc);
    return (ownOf(theme, '.ds-toasts')) ?? newRegion(doc, ownOf(theme, '.ds-app'), home);
    }
    function announce(text, options = {}) {
    const value = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (!value) return;
    const region = options.region ?? toastRegion();
    if (!region?.ownerDocument) return;
    speak(region, regionState(region), { text: value, assertive: options.assertive === true, key: typeof options.key === 'string' && options.key ? options.key : '' });
    }
    function toast(region, content, options = {}) {
    const target = region ?? (content == null ? null : toastRegion());
    const doc = target?.ownerDocument;
    if (!doc || content == null) return { el: null, close: () => Promise.resolve(), closed: Promise.resolve() };
    const state = regionState(target);
    const given = typeof content === 'object' && (content).nodeType === 1;
    const element = (given ? content : null);
    const kind = options.kind ?? (element?.matches('.ds-toast--error, .ds-tone-error') ? 'error' : element?.matches('.ds-toast--info, .ds-tone-info') ? 'info' : 'success');
    const label = !given && options.action ? String(options.action.label ?? '').trim() : '';
    const persistent = options.persistent === true || kind === 'error' || Boolean(label);
    const el = element ?? buildToast(doc, String(content), kind, persistent, options.closeLabel, label);
    const action = [...el.querySelectorAll('button, a[href]')].some((node) => !node.classList.contains('ds-toast__close'));
    if (given && persistent && !action && !el.querySelector('.ds-toast__close')) el.append(closeButton(doc, options.closeLabel));
    const text = ((el.querySelector('.ds-toast__text') ?? el).textContent ?? '').replace(/\s+/g, ' ').trim();
    if (/^(alert|status)$/.test(el.getAttribute('role') ?? '')) el.removeAttribute('role');
    el.removeAttribute('aria-live');
    const explicit = options.key != null && options.key !== '';
    const key = explicit ? String(options.key) : !given && !label && options.restart !== false ? `restart:${kind}:${persistent}:${normalText(text)}` : null;
    const match = key ? [...state.shown, ...state.queue].find((other) => other.key === key && (other.phase === 'shown' || other.phase === 'queued')) : null;
    if (match && (!explicit || match.el === el)) {
    if (match.phase === 'shown') restartToast(match, target, state);
    return match.handle;
    }
    const timeout = toastTimeout(target, text, options);
    let done = () => {};
    const closed = new Promise((resolve) => {
    done = () => resolve(undefined);
    });
    const stays = persistent || action || !Number.isFinite(timeout);
    const entry = {
    el, region: target, kind, key, stays, reserve: stays && options.reserve !== false, assertive: kind === 'error', text,
    timeout, remaining: timeout, timer: 0, started: 0, phase: 'queued', done, closed,
    onAction: label && typeof options.action?.onClick === 'function' ? options.action.onClick : null,
    handle: ( (null)),
    };
    entry.handle = { el, close: () => closeToast(entry), closed };
    toastEntries.set(el, entry);
    if (match) replaceToast(target, state, match, entry);
    else {
    state.queue.push(entry);
    updateToasts(target, state, []);
    }
    return entry.handle;
    }
    function closeToasts(region, filter = {}) {
    const target = region ?? toastRegion();
    const state = target ? toastRegions.get(target) : null;
    if (!state) return Promise.resolve();
    const matches = (entry) => (filter.kind == null || entry.kind === filter.kind) && (filter.key == null || entry.key === String(filter.key));
    const queued = state.queue.filter(matches);
    const shown = state.shown.filter((entry) => entry.phase === 'shown' && matches(entry));
    for (const entry of queued) {
    state.queue.splice(state.queue.indexOf(entry), 1);
    finishToast(entry);
    }
    if (shown.length) updateToasts(target, state, shown);
    return Promise.all([...queued, ...shown].map((entry) => entry.closed)).then(() => undefined);
    }
    function outcomeText(given, value) {
    const text = typeof given === 'function' ? given(value) : given;
    return text == null || text === false ? '' : String(text).replace(/\s+/g, ' ').trim();
    }
    function buildPending(doc, text, bar) {
    const el = doc.createElement('div');
    el.className = bar ? 'ds-toast ds-toast--progress' : 'ds-toast';
    const spinner = doc.createElement('span');
    spinner.className = 'ds-spinner ds-toast__spinner';
    spinner.setAttribute('aria-hidden', 'true');
    const span = doc.createElement('span');
    span.className = 'ds-toast__text';
    span.textContent = text;
    if (!bar) {
    el.append(spinner, span);
    return el;
    }
    const body = doc.createElement('div');
    body.className = 'ds-toast__body';
    const meter = doc.createElement('div');
    meter.className = 'ds-progress ds-progress--flat';
    const track = doc.createElement('div');
    track.className = 'ds-progress__track';
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    const fill = doc.createElement('div');
    fill.className = 'ds-progress__bar';
    track.append(fill);
    meter.append(track);
    body.append(span, meter);
    const value = doc.createElement('span');
    value.className = 'ds-toast__value';
    value.setAttribute('aria-hidden', 'true');
    el.append(body, value);
    return el;
    }
    function settleToast(entry, kind, text, options = {}) {
    const { el, region } = entry;
    const state = toastRegions.get(region);
    if (!state) return;
    if (entry.phase === 'gone' || entry.phase === 'leaving') {
    if (text) speak(region, state, { text, assertive: kind === 'error' });
    return;
    }
    if (!text) {
    closeToast(entry);
    return;
    }
    const doc = el.ownerDocument;
    const change = () => {
    const glyph = iconElement(kind === 'error' ? alertCircle : kind === 'info' ? info : checkCircle, 20, undefined, doc);
    const old = el.querySelector(':scope > .ds-toast__spinner, :scope > svg');
    if (old) old.replaceWith(glyph);
    else el.prepend(glyph);
    const span = el.querySelector('.ds-toast__text');
    if (span) {
    span.textContent = text;
    span.removeAttribute('id');
    if (span.parentElement !== el) el.querySelector(':scope > .ds-toast__body')?.replaceWith(span);
    }
    el.querySelector(':scope > .ds-toast__value')?.remove();
    el.classList.remove('ds-toast--progress', 'ds-toast--error', 'ds-toast--info');
    if (kind === 'error' || kind === 'info') el.classList.add(`ds-toast--${kind}`);
    el.removeAttribute('aria-busy');
    };
    if (entry.phase === 'shown' && el.parentNode === region) {
    flip(region, () => {
    change();
    stackFront(region, state);
    }).then(() => reserveRoom(region, state));
    } else change();
    entry.kind = kind;
    entry.text = text;
    entry.assertive = kind === 'error';
    entry.stays = kind === 'error' || options.persistent === true;
    entry.reserve = entry.stays && options.reserve !== false;
    disarm(entry);
    entry.timeout = toastTimeout(region, text, options);
    entry.remaining = entry.timeout;
    if (entry.phase === 'shown') {
    speak(region, state, entry);
    arm(entry, region, state);
    }
    }
    function promise(region, work, options = {}) {
    const target = region ?? toastRegion();
    const doc = target?.ownerDocument;
    let running;
    try {
    running = Promise.resolve(typeof work === 'function' ? work() : work);
    } catch (error) {
    running = Promise.reject(error);
    }
    if (!doc) {
    running.catch(() => {});
    return { el: null, close: () => Promise.resolve(), closed: Promise.resolve() };
    }
    const el = buildPending(doc, outcomeText(options.pending, undefined) || t('loading'), false);
    el.setAttribute('aria-busy', 'true');
    const handle = toast(target, el, { ...options, kind: 'info', persistent: true, restart: false });
    const entry = toastEntries.get(el);
    if (!entry) return handle;
    entry.kind = 'pending';
    running.then(
    (value) => settleToast(entry, 'success', outcomeText(options.success === undefined ? t('done') : options.success, value), options),
    (reason) => settleToast(entry, 'error', outcomeText(options.error === undefined ? t('actionFailed') : options.error, reason), options),
    );
    return handle;
    }
    let progressCount = 0;
    function progress(region, text, options = {}) {
    const target = region ?? toastRegion();
    const doc = target?.ownerDocument;
    const idle = { el: null, close: () => Promise.resolve(), closed: Promise.resolve(), set() {}, done() {}, fail() {} };
    if (!doc) return idle;
    const el = buildPending(doc, String(text ?? '').replace(/\s+/g, ' ').trim(), true);
    const span = (el.querySelector('.ds-toast__text'));
    const track = (el.querySelector('.ds-progress__track'));
    const figure = (el.querySelector('.ds-toast__value'));
    const meter = (el.querySelector('.ds-progress'));
    progressCount += 1;
    span.id = `ds-toast-progress-${progressCount}`;
    track.setAttribute('aria-labelledby', span.id);
    const show = (share) => {
    const known = typeof share === 'number' && Number.isFinite(share);
    const clamped = known ? Math.min(1, Math.max(0, share)) : null;
    setShare(meter, clamped);
    figure.textContent = clamped === null ? '' : percent(clamped, { maximumFractionDigits: 0 });
    };
    show(options.value ?? null);
    const handle = toast(target, el, { ...options, kind: 'info', persistent: true, restart: false });
    const entry = toastEntries.get(el);
    if (!entry) return { ...idle, ...handle };
    entry.kind = 'pending';
    let ended = false;
    return {
    ...handle,
    set(share, next) {
    if (ended) return;
    show(share);
    if (typeof next === 'string' && next.trim()) {
    span.textContent = next.replace(/\s+/g, ' ').trim();
    entry.text = span.textContent;
    }
    },
    done(next, more = {}) {
    if (ended) return;
    ended = true;
    setShare(meter, 1);
    settleToast(entry, 'success', outcomeText(next ?? t('done'), undefined), { ...options, ...more });
    },
    fail(next) {
    if (ended) return;
    ended = true;
    settleToast(entry, 'error', outcomeText(next ?? t('actionFailed'), undefined), options);
    },
    };
    }
    function closeToast(entry) {
    const state = toastRegions.get(entry.region);
    if (!state) return entry.closed;
    if (entry.phase === 'queued') {
    state.queue.splice(state.queue.indexOf(entry), 1);
    finishToast(entry);
    } else if (entry.phase === 'shown') updateToasts(entry.region, state, [entry]);
    return entry.closed;
    }
    function finishToast(entry) {
    if (entry.phase === 'gone') return;
    entry.phase = 'gone';
    disarm(entry);
    toastEntries.delete(entry.el);
    entry.done();
    }
    function restartToast(entry, region, state) {
    disarm(entry);
    entry.remaining = entry.timeout;
    arm(entry, region, state);
    speak(region, state, entry);
    }
    function replaceToast(region, state, old, entry) {
    if (old.phase === 'queued') {
    state.queue.splice(state.queue.indexOf(old), 1, entry);
    finishToast(old);
    return;
    }
    const focused = old.el.contains(activeIn(old.el));
    disarm(old);
    old.phase = 'leaving';
    state.shown.splice(state.shown.indexOf(old), 1, entry);
    entry.phase = 'shown';
    const moved = flip(region, (hooks) => {
    region.insertBefore(entry.el, old.el.parentNode === region ? old.el : null);
    const leaving = hooks.onRemove(old.el);
    if (leaving) leaving.then(() => finishToast(old));
    else {
    old.el.remove();
    finishToast(old);
    }
    });
    if (focused) {
    const button = entry.el.querySelector('.ds-toast__close');
    if (canFocus(button)) (button).focus({ preventScroll: true });
    else releaseToastFocus(old, region, state, state.shown.filter((other) => other !== entry));
    }
    shownNow(region, state, [entry], moved);
    }
    function releaseToastFocus(entry, region, state, staying) {
    const doc = region.ownerDocument;
    if (!entry.el.contains(activeIn(entry.el))) return;
    const others = staying.filter((other) => other.el.parentNode === region);
    const after = others.filter((other) => entry.el.compareDocumentPosition(other.el) & 4);
    const before = others.filter((other) => !after.includes(other)).reverse();
    const buttons = [...after, ...before].map((other) => other.el.querySelector('.ds-toast__close'));
    const origin = state.origin && !region.contains(state.origin) ? state.origin : null;
    const view = region.closest('[tabindex="-1"]') ?? doc.querySelector(LANDMARK);
    const target = [...buttons, origin, view].find((node) => canFocus(node) && !entry.el.contains(node));
    target?.focus({ preventScroll: true });
    }
    function updateToasts(region, state, closing) {
    const next = state.shown.filter((entry) => !closing.includes(entry));
    const added = [];
    const limit = limitOf(region);
    while (state.queue.length) {
    if (next.length >= limit) {
    const oldest = next.findIndex((entry) => !entry.stays);
    if (oldest < 0) break;
    next.splice(oldest, 1);
    }
    const entry = (state.queue.shift());
    next.push(entry);
    added.push(entry);
    }
    const removed = state.shown.filter((entry) => !next.includes(entry));
    const entering = added.filter((entry) => next.includes(entry));
    for (const entry of added) if (!next.includes(entry)) finishToast(entry);
    if (!removed.length && !entering.length) return;
    for (const entry of removed) {
    disarm(entry);
    entry.phase = 'leaving';
    }
    if (!state.shown.length && entering.length) writeLift(region, liftOf(region));
    state.shown = next;
    for (const entry of removed) releaseToastFocus(entry, region, state, next.filter((other) => !entering.includes(other)));
    const moved = flip(region, (hooks) => {
    for (const entry of removed) {
    const leaving = hooks.onRemove(entry.el);
    if (leaving) leaving.then(() => finishToast(entry));
    else {
    entry.el.remove();
    finishToast(entry);
    }
    }
    for (const entry of entering) {
    entry.phase = 'shown';
    region.append(entry.el);
    }
    stackFront(region, state);
    });
    if (state.expanded && next.length < 2) expandStack(region, state, false);
    shownNow(region, state, entering, moved);
    }
    function shownNow(region, state, entering, moved) {
    const landed = entering.map((entry) => {
    speak(region, state, entry);
    arm(entry, region, state);
    const played = settled(entry.el);
    played.then(() => {
    if (entry.phase !== 'shown') return;
    own(entry.el, 'classes', 'ds-toast--shown');
    entry.el.classList.add('ds-toast--shown');
    });
    return played;
    });
    Promise.all([moved, ...landed]).then(() => reserveRoom(region, state));
    }
    function hostOf(region) {
    const homes = toastHomes.get(region);
    const last = homes?.[homes.length - 1];
    return last && !last.leaving ? last.host : null;
    }
    function reserveTarget(region) {
    const host = hostOf(region);
    const node = (host
    ? (host.matches('.ds-dialog') ? host : host.querySelector('.ds-sheet__body'))
    : appOf(region)?.querySelector('.ds-view') ?? null);
    return node?.getAttribute('data-ds-toast-room') === 'off' ? null : node;
    }
    function releaseReserve(state) {
    state.observer?.disconnect();
    state.observer = null;
    const node = state.reserved;
    if (!node) return;
    state.reserved = null;
    node.removeAttribute('data-toast-reserve');
    node.style.removeProperty('--ds-toast-reserve');
    disown(node, 'attrs', 'data-toast-reserve');
    disown(node, 'props', '--ds-toast-reserve');
    }
    function reserveRoom(region, state) {
    const staying = state.shown.filter((entry) => entry.phase === 'shown' && entry.reserve && entry.el.parentNode === region);
    const node = staying.length && region.isConnected ? reserveTarget(region) : null;
    if (state.reserved && state.reserved !== node) releaseReserve(state);
    if (!node) return;
    const top = Math.min(...staying.map((entry) => entry.el.getBoundingClientRect().top));
    let room = 0;
    if (node.matches('.ds-dialog')) {
    const box = node.querySelector('.ds-dialog__box') ?? node;
    const applied = state.reserved === node ? parseFloat(node.style.getPropertyValue('--ds-toast-reserve')) || 0 : 0;
    if (box.getBoundingClientRect().bottom + applied / 2 <= top) {
    releaseReserve(state);
    return;
    }
    const doc = region.ownerDocument;
    room = (doc.documentElement.clientHeight || viewOf(region).innerHeight) - top + pxOf(region, '--ds-space-3', 12);
    } else room = node.getBoundingClientRect().bottom - top;
    if (state.reserved !== node) {
    own(node, 'attrs', 'data-toast-reserve');
    own(node, 'props', '--ds-toast-reserve');
    state.reserved = node;
    }
    node.setAttribute('data-toast-reserve', '');
    node.style.setProperty('--ds-toast-reserve', `${Math.ceil(Math.max(0, room))}px`);
    const Observer = viewOf(region).ResizeObserver;
    if (!state.observer && typeof Observer === 'function') {
    let first = true;
    state.observer = new Observer(() => {
    if (first) first = false;
    else reserveRoom(region, state);
    });
    state.observer.observe(region);
    }
    if (node.matches('.ds-dialog')) return;
    for (const el of new Set([activeIn(node), state.origin])) {
    if (!el || el === node || !node.contains(el) || typeof el.scrollIntoView !== 'function') continue;
    if (el.getBoundingClientRect().bottom > top) el.scrollIntoView({ block: 'nearest' });
    }
    }
    function liftOf(region) {
    const gap = pxOf(region, '--ds-space-2', 8);
    const above = (node) => (node && node.offsetHeight > 0 ? node.offsetHeight + gap : 0);
    const host = hostOf(region);
    if (host) return host.matches('.ds-sheet') ? above(host.querySelector('.ds-sheet__foot')) : 0;
    let lift = 0;
    const app = appOf(region);
    if (app?.hasAttribute('data-drawer-open') && viewOf(region).matchMedia?.(PHONE_QUERY).matches) lift = above(app.querySelector('.ds-drawer .ds-drawer__foot'));
    const theme = region.closest('.ds-theme');
    for (const bar of shownSavebars) if (bar.element.closest('.ds-theme') === theme) lift = Math.max(lift, bar.lift(region));
    return lift;
    }
    function writeLift(region, px) {
    const state = regionState(region);
    const style = (region).style;
    if (px > 0.5) {
    style.setProperty('--ds-toast-lift', `${round(px)}px`);
    if (!state.lifted) own(region, 'props', '--ds-toast-lift');
    state.lifted = true;
    } else {
    style.removeProperty('--ds-toast-lift');
    if (state.lifted) disown(region, 'props', '--ds-toast-lift');
    state.lifted = false;
    }
    }
    function liftRegion(region) {
    const next = liftOf(region);
    const now = parseFloat( (region).style.getPropertyValue('--ds-toast-lift')) || 0;
    if (Math.abs(next - now) < 0.5) return;
    const state = regionState(region);
    glideRegion(region, next > now ? 'enter' : 'exit', () => writeLift(region, next)).then(() => reserveRoom(region, state));
    }
    function moveRegion(region, parent, before) {
    const state = toastRegions.get(region);
    const active = activeIn(region);
    const refocus = active && region.contains(active) ? active : null;
    const nodes = [region, state?.polite, state?.assertive].filter((node) => node && node.parentNode === region.parentNode);
    const anchor = before && before.parentNode === parent ? before : null;
    for (const node of nodes) {
    if (typeof parent.moveBefore === 'function') {
    try {
    parent.moveBefore(node, anchor);
    continue;
    } catch {
    }
    }
    parent.insertBefore(node, anchor);
    }
    if (refocus && activeIn(refocus) !== refocus && canFocus(refocus)) refocus.focus({ preventScroll: true });
    }
    function glideRegion(region, direction, move) {
    const style = (region).style;
    const run = (followRuns.get(region) ?? 0) + 1;
    followRuns.set(region, run);
    if (![...region.children].some((child) => child.matches('.ds-toast:not([data-ds-leaving])'))) {
    style.removeProperty('--ds-toast-shift');
    style.removeProperty('--ds-toast-shift-y');
    move();
    region.removeAttribute('data-follow');
    return Promise.resolve();
    }
    const transition = style.transition;
    const from = region.getBoundingClientRect();
    style.transition = 'none';
    style.removeProperty('--ds-toast-shift');
    style.removeProperty('--ds-toast-shift-y');
    move();
    const to = region.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.bottom - to.bottom;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
    flushStyle(region);
    style.transition = transition;
    region.removeAttribute('data-follow');
    return Promise.resolve();
    }
    style.setProperty('--ds-toast-shift', `${round(dx)}px`);
    style.setProperty('--ds-toast-shift-y', `${round(dy)}px`);
    flushStyle(region);
    region.setAttribute('data-follow', direction);
    style.transition = transition;
    style.removeProperty('--ds-toast-shift');
    style.removeProperty('--ds-toast-shift-y');
    return settled(region, { transitions: true }).then(() => {
    if (followRuns.get(region) === run) region.removeAttribute('data-follow');
    });
    }
    function hostToasts(host, step) {
    const doc = host.ownerDocument;
    const theme = host.closest('.ds-theme');
    const scope = !theme || theme === doc.documentElement ? doc : theme;
    const regions = new Set([...scope.querySelectorAll('.ds-toasts')].filter((region) => !theme || region.closest('.ds-theme') === theme));
    if (step !== 'enter') for (const region of hostedRegions.keys()) regions.add(region);
    for (const region of regions) {
    if (step === 'enter') followInto(region, host);
    else if (step === 'exit') followOut(region, host);
    else giveRegionBack(region, host);
    }
    }
    function hostedLeft(region, host) {
    const panel = host.matches('.ds-sheet') ? host.querySelector('.ds-sheet__panel') : null;
    if (!panel) return NaN;
    return host.getBoundingClientRect().left + host.clientLeft + (panel).offsetLeft + pxOf(region, '--ds-space-6', 24);
    }
    function roomAfter(region, glide) {
    const state = toastRegions.get(region);
    if (!state) return;
    reserveRoom(region, state);
    glide.then(() => reserveRoom(region, state));
    }
    function followInto(region, host) {
    const homes = toastHomes.get(region) ?? [];
    const own = homes.find((home) => home.host === host);
    if (own) {
    if (own.leaving) {
    own.leaving = false;
    const left = hostedLeft(region, host);
    roomAfter(region, glideRegion(region, 'enter', () => {
    if (Number.isFinite(left)) (region).style.setProperty('--ds-toast-left', `${round(left)}px`);
    writeLift(region, liftOf(region));
    }));
    }
    return;
    }
    if (host.contains(region)) return;
    if (host.matches('.ds-sheet') && !host.querySelector('.ds-sheet__panel')) return;
    const state = toastRegions.get(region);
    let next = region.nextSibling;
    while (next && (next === state?.polite || next === state?.assertive)) next = next.nextSibling;
    const at = parseFloat(viewOf(region).getComputedStyle?.(region).left ?? '');
    homes.push({ host, parent: (region.parentNode), next, left: (region).style.getPropertyValue('--ds-toast-left'), at, leaving: false });
    toastHomes.set(region, homes);
    if (!hostedRegions.has(region)) {
    hostedRegions.set(region, [region, state?.polite, state?.assertive].filter((node) => node && node.parentNode === region.parentNode && keepAway(node)));
    }
    const sheetLeft = hostedLeft(region, host);
    const left = Number.isFinite(sheetLeft) ? sheetLeft : at;
    roomAfter(region, glideRegion(region, 'enter', () => {
    moveRegion(region, host, null);
    if (Number.isFinite(left)) (region).style.setProperty('--ds-toast-left', `${round(left)}px`);
    if (state) writeLift(region, liftOf(region));
    }));
    }
    function passHome(homes, index) {
    const home = homes[index];
    Object.assign(homes[index + 1], { parent: home.parent, next: home.next, left: home.left, at: home.at });
    homes.splice(index, 1);
    }
    function followOut(region, host) {
    const homes = toastHomes.get(region);
    const index = homes ? homes.findIndex((home) => home.host === host) : -1;
    if (!homes || index < 0) return;
    if (index < homes.length - 1) {
    passHome(homes, index);
    if (homes[homes.length - 1].leaving) glideHome(region, homes[homes.length - 1]);
    return;
    }
    homes[index].leaving = true;
    glideHome(region, homes[index]);
    }
    function glideHome(region, home) {
    const lift = toastRegions.has(region) ? liftOf(region) : 0;
    roomAfter(region, glideRegion(region, 'exit', () => {
    if (Number.isFinite(home.at)) (region).style.setProperty('--ds-toast-left', `${round(home.at)}px`);
    if (toastRegions.has(region)) writeLift(region, lift);
    }));
    }
    function releaseToasts(host) {
    const doc = host.ownerDocument;
    for (const region of new Set([...host.querySelectorAll('.ds-toasts'), ...doc.querySelectorAll('.ds-toasts')])) {
    const homes = toastHomes.get(region);
    const index = homes ? homes.findIndex((home) => home.host === host) : -1;
    if (index < 0) continue;
    if (index < homes.length - 1) {
    passHome(homes, index);
    continue;
    }
    homes[index].leaving = true;
    giveRegionBack(region, host, false);
    }
    }
    function giveRegionBack(region, host, glide = true) {
    const homes = toastHomes.get(region);
    const index = homes ? homes.findIndex((home) => home.host === host && home.leaving) : -1;
    if (!homes || index < 0) return;
    if (index < homes.length - 1) return passHome(homes, index);
    const home = homes[index];
    homes.pop();
    if (!homes.length) {
    toastHomes.delete(region);
    for (const node of hostedRegions.get(region) ?? []) keepHome(node, true);
    hostedRegions.delete(region);
    }
    const parent = home.parent.isConnected ? home.parent : host.parentNode;
    if (!parent) return;
    const move = () => {
    moveRegion(region, parent, home.next);
    const style = (region).style;
    if (home.left) style.setProperty('--ds-toast-left', home.left);
    else style.removeProperty('--ds-toast-left');
    if (toastRegions.has(region)) writeLift(region, liftOf(region));
    };
    roomAfter(region, glide ? glideRegion(region, 'exit', move) : (move(), Promise.resolve()));
    }
    internals.use('toast', {
    toast,
    announce,
    closeToasts,
    toastRegion,
    regionOfTheme,
    host: hostToasts,
    release: releaseToasts,
    lift: liftRegion,
    hosted: (region) => toastHomes.has(region),
    });

    return Object.freeze({
      toastRegion: toastRegion,
      announce: announce,
      toast: toast,
      closeToasts: closeToasts,
      promise: promise,
      progress: progress
    });
  });

  add('tooltip', ['tooltips'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define;
    const motionDuration = DS.motion.motionDuration, originFrom = DS.motion.originFrom, settled = DS.motion.settled;
    const claimAnchor = DS.position.claimAnchor, dropProbe = DS.position.dropProbe, positionPlace = DS.position.place, pxOf = DS.position.pxOf, releaseAnchor = DS.position.releaseAnchor, supportsAnchoring = DS.position.supportsAnchoring;
    const internals = DS.overlay.internals;
    const { tooltipControllers, neverInert, activeIn, sharedOf, own, disown, viewOf, flushStyle, watchModality, layerOver, opensOpenLayer, nextAnchorName, clock, normalText, nextFrame } = internals;
    let tooltipWarned = false;
    function accessibleName(node) {
    const doc = node.ownerDocument;
    const ids = (node.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
    if (ids.length) return ids.map((id) => doc.getElementById(id)?.textContent ?? '').join(' ');
    return node.getAttribute('aria-label') ?? node.textContent ?? '';
    }
    const TAP_SLOP_PX = 10;
    const CUT_DESCENDANTS = 24;
    const CUT_ANCESTORS = 3;
    function visibleText(trigger) {
    const doc = trigger.ownerDocument;
    const verdicts = new Map();
    const hidden = (element) => {
    for (let at = element; at && at !== trigger.parentElement; at = at.parentElement) {
    if (verdicts.has(at)) return verdicts.get(at);
    const box = at.getBoundingClientRect?.();
    const gone = at.matches('.ds-sr, [aria-hidden="true"], svg, svg *') || !at.getClientRects?.().length || (box && box.width <= 1 && box.height <= 1);
    if (gone) {
    verdicts.set(at, true);
    return true;
    }
    if (at === trigger) break;
    }
    verdicts.set(element, false);
    return false;
    };
    const walker = doc.createTreeWalker(trigger, 4);
    const parts = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (parent && node.nodeValue?.trim() && !hidden(parent)) parts.push(node.nodeValue);
    }
    return normalText(parts.join(' '));
    }
    function clips(element) {
    const style = viewOf(element).getComputedStyle?.(element);
    if (!style || (style.overflowX === 'visible' && style.overflowY === 'visible')) return false;
    return element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
    }
    function tipWanted(trigger) {
    const tip = normalText(trigger.getAttribute('data-tip'));
    if (!tip) return null;
    if (normalText(trigger.getAttribute('data-tip-shortcut'))) return 'adds';
    const text = visibleText(trigger);
    if (text !== tip) return 'adds';
    if (clips(trigger)) return 'cut';
    const descendants = trigger.querySelectorAll('*');
    for (let index = 0; index < descendants.length && index < CUT_DESCENDANTS; index += 1) if (clips(descendants[index])) return 'cut';
    let at = trigger.parentElement;
    for (let step = 0; at && step < CUT_ANCESTORS && normalText(at.textContent) === text; step += 1, at = at.parentElement) {
    if (clips(at)) return 'cut';
    }
    return null;
    }
    const SIDES = new Set(['bottom', 'top', 'start', 'end']);
    function sideOf(trigger) {
    const side = trigger.getAttribute('data-tip-placement') ?? '';
    return SIDES.has(side) ? side : 'bottom';
    }
    function focusVisible(node) {
    try {
    return node.matches(':focus-visible');
    } catch {
    return true;
    }
    }
    function tooltips(root = globalThis.document) {
    const doc = root?.nodeType === 9 ? (root) : root?.ownerDocument;
    if (!doc) return { destroy() {} };
    const view = doc.defaultView ?? globalThis;
    const shadow = root.nodeType === 11;
    const rootElement = root.nodeType === 9 ? doc.documentElement : (root);
    const roots = sharedOf(doc).tipRoots;
    const existing = roots.get(rootElement);
    if (existing) return existing;
    watchModality(doc);
    const theme = shadow ? (root).querySelector('.ds-theme')
    : rootElement.closest('.ds-theme') ?? (root.nodeType === 9 ? doc.querySelector('.ds-theme') : null);
    if (!theme && !tooltipWarned) {
    tooltipWarned = true;
    view.console?.warn('Z-Dash: DS.overlay.tooltips() on a root outside .ds-theme. The tooltip must sit inside the .ds-theme element, or it gets neither the tokens nor the motion.');
    }
    const anchored = supportsAnchoring(view);
    const home = !theme || theme === doc.documentElement ? doc.body : theme;
    const tip = doc.createElement('div');
    tip.className = 'ds-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.id = `ds-tooltip-${sharedOf(doc).seq += 1}`;
    tip.hidden = true;
    tip.setAttribute('data-state', 'closed');
    if (anchored) {
    tip.setAttribute('popover', 'manual');
    tip.setAttribute('data-anchored', '');
    }
    neverInert.add(tip);
    tip.setAttribute('data-ds-keep', '');
    home.append(tip);
    let phase = 'hidden';
    let trigger = (null);
    let hovering = false;
    let focusing = false;
    let showTimer = (0);
    let hideTimer = (0);
    let lastHide = -Infinity;
    let run = 0;
    let frame = 0;
    let ownAnchor = (null);
    let described = (null);
    let press = (null);
    let touchShown = false;
    let swallow = (null);
    const Observer = view.MutationObserver;
    const watcher = typeof Observer === 'function' ? new Observer(() => {
    if (phase !== 'hidden' && trigger && !trigger.isConnected) hideNow();
    }) : null;
    let watching = false;
    const time = (token) => motionDuration(tip.isConnected ? tip : shadow ? theme ?? (root).host : rootElement, token);
    function delayOf(trigger) {
    const delay = trigger.getAttribute('data-tip-delay');
    if (delay === 'none') return 0;
    if (delay === 'short') return time('--ds-delay-tooltip-skip');
    if (delay === 'long') return 2 * time('--ds-delay-tooltip');
    return time('--ds-delay-tooltip');
    }
    const contains = (node) => (root.nodeType === 9 ? doc.contains(node) : rootElement.contains(node));
    function hostFor(node) {
    return node.closest('dialog[open], .ds-dialog:not(.ds-dialog--contained), .ds-sheet') ?? home;
    }
    function anchorTo(next) {
    if (!anchored || (ownAnchor && ownAnchor === next)) return;
    unanchor();
    const { name, mine } = claimAnchor(next, () => nextAnchorName(doc));
    if (mine) ownAnchor = (next);
    tip.style.setProperty('position-anchor', name);
    }
    function unanchor() {
    releaseAnchor(ownAnchor);
    ownAnchor = null;
    }
    function readSide(next) {
    const box = tip.getBoundingClientRect();
    const anchor = next.getBoundingClientRect();
    const rtl = view.getComputedStyle?.(next).direction === 'rtl';
    let side = 'bottom';
    if (box.bottom <= anchor.top + 1) side = 'top';
    else if (box.right <= anchor.left + 1) side = rtl ? 'end' : 'start';
    else if (box.left >= anchor.right - 1) side = rtl ? 'start' : 'end';
    if (side === (tip.getAttribute('data-placement') ?? 'bottom')) return false;
    if (side === 'bottom') tip.removeAttribute('data-placement');
    else tip.setAttribute('data-placement', side);
    return true;
    }
    function place(next) {
    const side = sideOf(next);
    if (side === 'bottom') tip.removeAttribute('data-side');
    else tip.setAttribute('data-side', side);
    if (anchored) {
    readSide(next);
    const mine = run;
    nextFrame(doc, () => nextFrame(doc, () => {
    if (mine !== run || phase !== 'open' || trigger !== next || !tip.isConnected) return;
    if (readSide(next)) originFrom(next, tip);
    }));
    return;
    }
    const gap = pxOf(tip, '--ds-space-2', 8);
    positionPlace(tip, next, { side, align: 'center', offset: gap, padding: gap, flip: 'fits', size: false, x: '--ds-tooltip-x', y: '--ds-tooltip-y' });
    }
    function describe(next, why) {
    undescribe();
    if (why === 'cut' || normalText(tip.textContent) === normalText(accessibleName(next))) return;
    const ids = (next.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    if (!ids.includes(tip.id)) next.setAttribute('aria-describedby', [...ids, tip.id].join(' '));
    own(next, 'attrs', 'aria-describedby');
    described = next;
    }
    function undescribe() {
    if (!described) return;
    const ids = (described.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id && id !== tip.id);
    if (ids.length) described.setAttribute('aria-describedby', ids.join(' '));
    else described.removeAttribute('aria-describedby');
    disown(described, 'attrs', 'aria-describedby');
    described = null;
    }
    function cancelTimers() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    showTimer = 0;
    hideTimer = 0;
    }
    function show(next, touch = false) {
    cancelTimers();
    const text = next.getAttribute('data-tip') ?? '';
    const why = next.isConnected && !opensOpenLayer(next) ? tipWanted(next) : null;
    if (!text.trim() || !why) return;
    touchShown = touch;
    if (watcher && !watching) {
    watcher.observe(shadow ? (root) : rootElement, { childList: true, subtree: true });
    watching = true;
    }
    const host = hostFor(next);
    const visible = phase !== 'hidden' && tip.parentNode === host;
    const warm = !visible && clock() - lastHide < time('--ds-delay-tooltip-skip');
    run += 1;
    trigger = next;
    focusing = next === activeIn(next) && focusVisible(next);
    tip.textContent = text;
    const shortcut = next.getAttribute('data-tip-shortcut');
    if (shortcut) {
    const slot = doc.createElement('span');
    slot.className = 'ds-tooltip__shortcut';
    slot.textContent = shortcut;
    tip.append(slot);
    }
    if (visible) {
    anchorTo(next);
    place(next);
    originFrom(next, tip);
    tip.setAttribute('data-state', 'open');
    } else {
    if (tip.parentNode !== host) {
    try {
    if (anchored && tip.matches(':popover-open')) tip.hidePopover();
    } catch {
    }
    host.append(tip);
    }
    tip.setAttribute('data-state', 'closed');
    tip.setAttribute('data-warm', '');
    tip.hidden = false;
    anchorTo(next);
    if (anchored) {
    try {
    tip.showPopover();
    } catch {
    }
    }
    place(next);
    originFrom(next, tip);
    tip.style.transition = 'none';
    if (!warm) tip.removeAttribute('data-warm');
    flushStyle(tip);
    tip.style.removeProperty('transition');
    tip.setAttribute('data-state', 'open');
    }
    phase = 'open';
    describe(next, why);
    }
    function unwatch() {
    if (!watching) return;
    watcher?.disconnect();
    watching = false;
    }
    function rest() {
    phase = 'hidden';
    trigger = null;
    touchShown = false;
    try {
    if (anchored && tip.matches(':popover-open')) tip.hidePopover();
    } catch {
    }
    tip.hidden = true;
    unanchor();
    dropProbe(tip);
    }
    function hide() {
    cancelTimers();
    if (phase !== 'open') return;
    phase = 'closing';
    lastHide = clock();
    undescribe();
    unwatch();
    const mine = ++run;
    tip.setAttribute('data-state', 'closed');
    settled(tip, { transitions: true }).then(() => {
    if (mine !== run || phase !== 'closing') return;
    rest();
    });
    }
    function hideNow() {
    cancelTimers();
    if (phase === 'hidden') return;
    if (phase === 'open') lastHide = clock();
    undescribe();
    unwatch();
    run += 1;
    hovering = false;
    focusing = false;
    tip.style.transition = 'none';
    tip.setAttribute('data-state', 'closed');
    flushStyle(tip);
    tip.style.removeProperty('transition');
    rest();
    }
    function hideLater() {
    clearTimeout(showTimer);
    showTimer = 0;
    if (hovering || focusing || phase !== 'open' || hideTimer) return;
    hideTimer = setTimeout(() => {
    hideTimer = 0;
    if (!hovering && !focusing) hide();
    }, time('--ds-delay-tooltip-hide'));
    }
    const triggerOf = (node) => {
    const found = (node?.closest?.('[data-tip]') ?? null);
    if (!found || !contains(found)) return null;
    for (let at = (found); at; at = at.parentElement) {
    if (roots.has(at)) return at === rootElement ? found : null;
    }
    return found;
    };
    function onPointerOver( event) {
    if (event.pointerType === 'touch') return;
    const next = triggerOf(event.target);
    if (!next || next.contains( (event.relatedTarget))) return;
    if (!tipWanted(next)) return;
    hovering = true;
    clearTimeout(hideTimer);
    hideTimer = 0;
    if (phase === 'open' && trigger === next) return;
    if (phase !== 'hidden' || clock() - lastHide < time('--ds-delay-tooltip-skip')) {
    show(next);
    return;
    }
    clearTimeout(showTimer);
    const wait = delayOf(next);
    if (wait <= 0) {
    show(next);
    return;
    }
    showTimer = setTimeout(() => {
    showTimer = 0;
    show(next);
    }, wait);
    }
    function onPointerOut( event) {
    if (event.pointerType === 'touch') return;
    const from = triggerOf(event.target);
    const to = (event.relatedTarget);
    if (!from || from.contains(to) || tip.contains(to)) return;
    hovering = false;
    hideLater();
    }
    function onTipOver( event) {
    if (event.pointerType === 'touch' || phase !== 'open') return;
    hovering = true;
    clearTimeout(hideTimer);
    hideTimer = 0;
    }
    function onTipOut( event) {
    if (event.pointerType === 'touch') return;
    const to = (event.relatedTarget);
    if (tip.contains(to) || trigger?.contains(to)) return;
    hovering = false;
    hideLater();
    }
    function onFocusIn( event) {
    const next = triggerOf(event.target);
    if (!next || !focusVisible(next) || !tipWanted(next)) return;
    hovering = false;
    show(next);
    }
    function onFocusOut( event) {
    const from = triggerOf(event.target);
    if (!from || from !== trigger || from.contains( (event.relatedTarget))) return;
    focusing = false;
    hideLater();
    }
    function onKeyDown( event) {
    if (event.key !== 'Escape' || event.defaultPrevented || !escape()) return;
    event.preventDefault();
    event.stopPropagation();
    }
    const origin = ( event) => (event.composedPath?.()[0] ?? event.target);
    const tapShows = (node) => node.matches('[role="img"], [aria-disabled="true"]');
    function cancelPress() {
    if (press) clearTimeout(press.timer);
    press = null;
    }
    function unswallow() {
    if (!swallow) return;
    doc.removeEventListener('click', swallow, true);
    doc.removeEventListener('contextmenu', swallow, true);
    swallow = null;
    }
    function swallowNext() {
    unswallow();
    swallow = ( event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === 'click') unswallow();
    };
    doc.addEventListener('click', swallow, true);
    doc.addEventListener('contextmenu', swallow, true);
    }
    function onPointerDown( event) {
    clearTimeout(showTimer);
    showTimer = 0;
    unswallow();
    cancelPress();
    const next = event.pointerType === 'touch' ? triggerOf(origin(event)) : null;
    const hidesOwn = Boolean(next) && phase === 'open' && touchShown && trigger === next;
    hide();
    if (!next || hidesOwn) return;
    press = { trigger: next, id: event.pointerId, x: event.clientX, y: event.clientY, timer: 0 };
    if (tapShows(next) || next.matches('a[href]')) return;
    press.timer = setTimeout(() => {
    if (!press || press.trigger !== next) return;
    press = null;
    show(next, true);
    if (phase === 'open' && trigger === next) swallowNext();
    }, time('--ds-delay-tooltip'));
    }
    function onPointerMove( event) {
    if (!press || event.pointerId !== press.id) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > TAP_SLOP_PX) cancelPress();
    }
    function onPointerUp( event) {
    if (!press || event.pointerId !== press.id) return;
    const next = press.trigger;
    const near = Math.hypot(event.clientX - press.x, event.clientY - press.y) <= TAP_SLOP_PX;
    cancelPress();
    if (near && tapShows(next) && triggerOf(origin(event)) === next) show(next, true);
    }
    function onScroll() {
    if (phase === 'open' && touchShown) {
    hide();
    return;
    }
    if (phase !== 'open' || frame) return;
    const update = () => {
    frame = 0;
    if (phase !== 'open' || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gone = !trigger.isConnected || rect.bottom <= 0 || rect.right <= 0 || rect.top >= view.innerHeight || rect.left >= view.innerWidth;
    if (gone) hide();
    else if (!anchored) place(trigger);
    };
    frame = typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(update) : 0;
    if (!frame) update();
    }
    function escape() {
    if (phase !== 'open') return false;
    const under = Boolean(trigger?.isConnected && layerOver(trigger));
    hovering = false;
    focusing = false;
    hide();
    return !under;
    }
    const controller = {
    hide() {
    clearTimeout(showTimer);
    showTimer = 0;
    hide();
    },
    escape,
    };
    tooltipControllers.add(controller);
    const target = (root);
    target.addEventListener('pointerover', onPointerOver);
    target.addEventListener('pointerout', onPointerOut);
    target.addEventListener('focusin', onFocusIn);
    target.addEventListener('focusout', onFocusOut);
    tip.addEventListener('pointerover', onTipOver);
    tip.addEventListener('pointerout', onTipOut);
    doc.addEventListener('keydown', onKeyDown, true);
    doc.addEventListener('pointerdown', onPointerDown, true);
    doc.addEventListener('pointermove', onPointerMove, { capture: true, passive: true });
    doc.addEventListener('pointerup', onPointerUp, true);
    doc.addEventListener('pointercancel', cancelPress, true);
    doc.addEventListener('scroll', onScroll, { capture: true, passive: true });
    view.addEventListener('resize', onScroll);
    const handle = {
    destroy() {
    if (roots.get(rootElement) === handle) roots.delete(rootElement);
    tooltipControllers.delete(controller);
    cancelTimers();
    if (frame && typeof view.cancelAnimationFrame === 'function') view.cancelAnimationFrame(frame);
    target.removeEventListener('pointerover', onPointerOver);
    target.removeEventListener('pointerout', onPointerOut);
    target.removeEventListener('focusin', onFocusIn);
    target.removeEventListener('focusout', onFocusOut);
    doc.removeEventListener('keydown', onKeyDown, true);
    doc.removeEventListener('pointerdown', onPointerDown, true);
    doc.removeEventListener('pointermove', onPointerMove, { capture: true });
    doc.removeEventListener('pointerup', onPointerUp, true);
    doc.removeEventListener('pointercancel', cancelPress, true);
    doc.removeEventListener('scroll', onScroll, { capture: true });
    view.removeEventListener('resize', onScroll);
    cancelPress();
    unswallow();
    unwatch();
    undescribe();
    unanchor();
    dropProbe(tip);
    run += 1;
    phase = 'hidden';
    tip.remove();
    },
    };
    roots.set(rootElement, handle);
    return handle;
    }
    define('tooltips', {
    global(root) {
    const doc = root.nodeType === 9 ? root : root.ownerDocument;
    const existed = Boolean(doc) && sharedOf(doc).tipRoots.has(root.nodeType === 9 ? doc.documentElement : root);
    const handle = tooltips(root);
    return existed ? () => {} : () => handle.destroy();
    },
    });
    internals.use('tooltip', { tooltips });

    return Object.freeze({
      tooltips: tooltips
    });
  });

  add('truncate', ['cut', 'fit', 'create'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, emit = DS.core.emit;
    const own = DS.dom.own, disown = DS.dom.disown;
    const POSITIONS = Object.freeze(['end', 'start', 'middle']);
    const ELLIPSIS = '…';
    let segmenter = null;
    function graphemes(text) {
    if (typeof Intl.Segmenter !== 'function') return Array.from(text);
    segmenter ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (part) => part.segment);
    }
    function cutParts(parts, keep, position) {
    if (keep >= parts.length) return parts.join('');
    const n = Math.max(0, Math.floor(keep));
    if (position === 'start') return ELLIPSIS + parts.slice(parts.length - n).join('').trimStart();
    if (position === 'middle') {
    const head = Math.ceil(n / 2);
    const tail = n - head;
    return parts.slice(0, head).join('').trimEnd() + ELLIPSIS + (tail ? parts.slice(parts.length - tail).join('').trimStart() : '');
    }
    return parts.slice(0, n).join('').trimEnd() + ELLIPSIS;
    }
    function keepParts(parts, position, fits) {
    if (fits(parts.join(''))) return parts.length;
    return largest(parts.length, (keep) => fits(cutParts(parts, keep, position)));
    }
    function cut(text, keep, position = 'end') {
    return cutParts(graphemes(String(text ?? '')), keep, position);
    }
    function fit(text, position, fits) {
    const parts = graphemes(String(text ?? ''));
    return cutParts(parts, keepParts(parts, position, fits), position);
    }
    const contexts = new WeakMap();
    function contextOf(doc) {
    if (!contexts.has(doc)) {
    let context = null;
    try {
    context = doc.createElement('canvas').getContext?.('2d') ?? null;
    } catch {
    context = null;
    }
    contexts.set(doc, context);
    }
    return contexts.get(doc);
    }
    const advances = new Map();
    function advancesOf(context, font, transform, parts) {
    let known = advances.get(font);
    if (!known) {
    known = new Map();
    advances.set(font, known);
    }
    if (context.font !== font) context.font = font;
    return parts.map((part) => {
    let width = known.get(part);
    if (width === undefined) {
    width = context.measureText(transform(part)).width;
    known.set(part, width);
    }
    return width;
    });
    }
    function largest(total, fits) {
    let low = 0;
    let high = total - 1;
    while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (fits(mid)) low = mid;
    else high = mid - 1;
    }
    return low;
    }
    function setText(node, value) {
    const first = node.firstChild;
    if (first && first === node.lastChild && first.nodeType === 3) {
    if (first.data !== value) first.data = value;
    } else if (node.textContent !== value) {
    node.textContent = value;
    }
    }
    function fontOf(style) {
    const variant = style.fontVariantCaps === 'small-caps' ? 'small-caps ' : '';
    return `${style.fontStyle} ${variant}${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    }
    function transformOf(style) {
    if (style.textTransform === 'uppercase') return (text) => text.toUpperCase();
    if (style.textTransform === 'lowercase') return (text) => text.toLowerCase();
    return (text) => text;
    }
    function sizeOf(record) {
    const box = record.borderBoxSize;
    const first = Array.isArray(box) || (box && typeof box.length === 'number') ? box[0] : box;
    return first?.inlineSize ?? record.contentRect.width;
    }
    const batches = new WeakMap();
    function batchOf(view) {
    let batch = batches.get(view);
    if (batch) return batch;
    batch = { dirty: new Set(), all: new Set(), queued: false, targets: new Map(), seen: new WeakMap(), observer: null };
    if (typeof view.ResizeObserver === 'function') {
    batch.observer = new view.ResizeObserver((records) => {
    for (const record of records) {
    const size = sizeOf(record);
    const seen = batch.seen.get(record.target);
    if (seen !== undefined && Math.abs(seen - size) < 0.5) continue;
    batch.seen.set(record.target, size);
    for (const one of batch.targets.get(record.target) ?? []) batch.dirty.add(one);
    }
    flush(batch);
    });
    }
    view.document?.fonts?.addEventListener?.('loadingdone', () => {
    advances.clear();
    for (const one of batch.all) one.stale();
    for (const one of batch.all) batch.dirty.add(one);
    flush(batch);
    });
    batches.set(view, batch);
    return batch;
    }
    function watch(batch, target, one) {
    if (!batch.observer || !target) return;
    const list = batch.targets.get(target) ?? new Set();
    if (!list.size) batch.observer.observe(target);
    list.add(one);
    batch.targets.set(target, list);
    }
    function unwatch(batch, target, one) {
    const list = target ? batch.targets.get(target) : null;
    if (!list) return;
    list.delete(one);
    if (!list.size) {
    batch.targets.delete(target);
    batch.observer?.unobserve(target);
    }
    }
    function schedule(batch, one) {
    batch.dirty.add(one);
    if (batch.queued) return;
    batch.queued = true;
    queueMicrotask(() => {
    if (batch.queued) flush(batch);
    });
    }
    function flush(batch) {
    batch.queued = false;
    const list = [...batch.dirty].filter((one) => one.live());
    batch.dirty.clear();
    if (!list.length) return;
    for (const one of list) one.probe();
    for (const one of list) one.prepare();
    for (const one of list) one.read();
    for (const one of list) one.write();
    let over = list.filter((one) => one.check());
    for (let round = 0; over.length && round < 8; round += 1) {
    for (const one of over) one.shorter();
    over = over.filter((one) => one.check());
    }
    for (const one of list) one.done();
    }
    function controller(el, given, measureNow = false) {
    const doc = el.ownerDocument;
    const view = doc?.defaultView ?? globalThis;
    const batch = batchOf(view);
    const listeners = new Set();
    let live = true;
    let text = given.text ?? el.getAttribute('data-ds-truncate-text') ?? el.textContent ?? '';
    let shownText = text;
    let wroteTip = false;
    let parts = null;
    let pass = null;
    let split = { text: null, parts: [] };
    let scale = { text: null, font: null, ratio: 1 };
    let parent = null;
    const position = () => {
    const named = given.position ?? el.getAttribute('data-ds-truncate');
    return POSITIONS.includes(named) ? named : 'end';
    };
    const tip = (on) => {
    if (on) {
    if (!wroteTip && el.hasAttribute('data-tip')) return;
    if (!wroteTip) {
    wroteTip = true;
    own(el, 'attrs', 'data-tip');
    }
    if (el.getAttribute('data-tip') !== text) el.setAttribute('data-tip', text);
    } else if (wroteTip) {
    wroteTip = false;
    el.removeAttribute('data-tip');
    disown(el, 'attrs', 'data-tip');
    }
    };
    const plain = () => {
    if (!parts) return;
    parts = null;
    el.textContent = text;
    };
    const whole = () => {
    if (!parts) {
    const shown = doc.createElement('span');
    shown.className = 'ds-truncate__shown';
    shown.setAttribute('aria-hidden', 'true');
    const sr = doc.createElement('span');
    sr.className = 'ds-sr';
    parts = { shown, whole: sr };
    }
    setText(parts.whole, text);
    setText(parts.shown, text);
    if (parts.shown.parentNode !== el || parts.whole.parentNode !== el) el.replaceChildren(parts.shown, parts.whole);
    };
    const overflowing = () => el.scrollWidth > el.clientWidth + 0.5;
    const follow = () => {
    const next = el.parentElement;
    if (next === parent) return;
    unwatch(batch, parent, one);
    parent = next;
    watch(batch, parent, one);
    };
    const one = {
    live: () => live,
    stale() {
    scale = { text: null, font: null, ratio: 1 };
    },
    probe() {
    follow();
    const at = position();
    pass = { at, before: shownText, graphemes: null, keep: 0, fits: true, sized: null, over: false, known: false };
    if (at === 'end' || !parts || shownText === text || scale.text !== text || !el.isConnected || !overflowing()) return;
    const style = view.getComputedStyle(parts.shown);
    const font = fontOf(style);
    if (font !== scale.font || !contextOf(doc)) return;
    const box = view.getComputedStyle(el);
    pass.fits = false;
    pass.known = true;
    pass.graphemes = split.parts;
    pass.sized = { room: el.clientWidth - (parseFloat(box.paddingLeft) || 0) - (parseFloat(box.paddingRight) || 0), drawn: 0, font, transform: transformOf(style) };
    },
    prepare() {
    if (pass.known) return;
    if (pass.at === 'end' || !el.isConnected) plain();
    else whole();
    },
    read() {
    if (pass.known || pass.at === 'end' || !el.isConnected) return;
    pass.fits = !overflowing();
    if (pass.fits) return;
    if (split.text !== text) split = { text, parts: graphemes(text) };
    pass.graphemes = split.parts;
    const context = contextOf(doc);
    if (!context) return;
    const box = view.getComputedStyle(el);
    const style = view.getComputedStyle(parts.shown);
    const room = el.clientWidth - (parseFloat(box.paddingLeft) || 0) - (parseFloat(box.paddingRight) || 0);
    const drawn = parts.shown.getBoundingClientRect().width;
    pass.sized = { room, drawn, font: fontOf(style), transform: transformOf(style) };
    },
    write() {
    const { at } = pass;
    if (at === 'end' || !el.isConnected) {
    shownText = text;
    return;
    }
    if (pass.fits) {
    pass.keep = Infinity;
    } else if (pass.sized) {
    const { room, drawn, font, transform } = pass.sized;
    const context = contextOf(doc);
    const widths = advancesOf(context, font, transform, pass.graphemes);
    const [ellipsis] = advancesOf(context, font, transform, [ELLIPSIS]);
    const count = widths.length;
    const before = [0];
    for (const width of widths) before.push(before.at(-1) + width);
    const sum = before[count];
    if (!pass.known) scale = { text, font, ratio: sum > 0 && drawn > 0 ? drawn / sum : 1 };
    const { ratio } = scale;
    const span = (keep) => {
    if (at === 'start') return sum - before[count - keep];
    const head = Math.ceil(keep / 2);
    return before[head] + sum - before[count - (keep - head)];
    };
    pass.keep = largest(count, (keep) => (span(keep) + ellipsis) * ratio <= room + 0.5);
    } else {
    pass.keep = keepParts(pass.graphemes, at, (candidate) => {
    setText(parts.shown, candidate);
    return !overflowing();
    });
    }
    shownText = pass.graphemes && pass.keep < pass.graphemes.length ? cutParts(pass.graphemes, pass.keep, at) : text;
    if (shownText === text) plain();
    else setText(parts.shown, shownText);
    },
    check() {
    if (!el.isConnected) return false;
    batch.seen.set(el, el.getBoundingClientRect().width);
    if (parent) batch.seen.set(parent, parent.getBoundingClientRect().width);
    pass.over = overflowing();
    return Boolean(parts) && pass.graphemes !== null && pass.keep > 0 && pass.over;
    },
    shorter() {
    pass.keep -= 1;
    shownText = cutParts(pass.graphemes, pass.keep, pass.at);
    setText(parts.shown, shownText);
    },
    done() {
    if (!pass) return;
    const { at, before } = pass;
    if (at === 'end' || !el.isConnected) tip(el.isConnected && pass.over);
    else tip(shownText !== text);
    watcher?.takeRecords();
    pass = null;
    if (shownText !== before) {
    const detail = { text, shown: shownText, cut: shownText !== text };
    for (const fn of [...listeners]) fn(detail);
    }
    },
    };
    const now = () => {
    if (!live) return;
    batch.dirty.add(one);
    flush(batch);
    };
    const watcher = typeof view.MutationObserver === 'function' ? new view.MutationObserver(() => {
    if (!live) return;
    const ours = parts ? parts.shown.parentNode === el : el.textContent === text;
    if (!ours) {
    text = el.textContent ?? '';
    parts = null;
    }
    schedule(batch, one);
    }) : null;
    watcher?.observe(el, { childList: true, characterData: true, subtree: true });
    batch.all.add(one);
    watch(batch, el, one);
    follow();
    if (measureNow) now();
    else schedule(batch, one);
    const api = {
    get() {
    if (batch.dirty.has(one)) flush(batch);
    return { text, shown: shownText, cut: shownText !== text };
    },
    set(next) {
    text = String(next ?? '');
    if (el.hasAttribute('data-ds-truncate-text')) el.setAttribute('data-ds-truncate-text', text);
    now();
    if (live) emit(el, 'change', { text, shown: shownText, cut: shownText !== text });
    },
    on(type, fn) {
    if (type !== 'change') return () => {};
    listeners.add(fn);
    return () => listeners.delete(fn);
    },
    update() {
    const named = el.getAttribute('data-ds-truncate-text');
    if (named !== null) text = named;
    now();
    },
    destroy() {
    if (!live) return;
    live = false;
    watcher?.disconnect();
    batch.dirty.delete(one);
    batch.all.delete(one);
    unwatch(batch, el, one);
    unwatch(batch, parent, one);
    listeners.clear();
    tip(false);
    if (parts) el.textContent = text;
    },
    };
    return api;
    }
    define('truncate', {
    attribute: 'data-ds-truncate',
    attributes: ['data-ds-truncate-text'],
    init(el) {
    return controller(el, {});
    },
    });
    function create(el, options = {}) {
    return controller(el, options, true);
    }

    return Object.freeze({
      cut: cut,
      fit: fit,
      create: create
    });
  });

  add('wizard', ['fieldLabel', 'fieldValue', 'create'], function () {
    /*! Z-Dash 3.0.1 | MIT License | https://github.com/saschazesiger/Z-Dash */
    const define = DS.core.define, emit = DS.core.emit, t = DS.core.t;
    const enter = DS.motion.enter;
    const morphHtml = DS.dom.morphHtml;
    const announce = DS.a11y.announce;
    const icon = DS.icons.icon, iconElement = DS.icons.iconElement, alertCircle = DS.icons.alertCircle, check = DS.icons.check;
    const FIELDS = 'input:not([type="hidden"], [type="button"], [type="submit"], [type="reset"], [type="image"]), select, textarea';
    let serial = 0;
    const esc = (text) => String(text ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    function textOf(node) {
    if (!node) return '';
    const copy = node.cloneNode(true);
    for (const part of copy.querySelectorAll('.ds-sr, .ds-field__required, .ds-field__optional, svg, input, select, textarea')) part.remove();
    return copy.textContent.replace(/\s+/g, ' ').trim();
    }
    function labelOf(panel) {
    return panel.getAttribute('data-ds-wizard-label') || textOf(panel.querySelector('.ds-wizard__title, h1, h2, h3, h4, h5, h6, legend')) || '';
    }
    function fieldLabel(field) {
    const own = field.getAttribute('data-ds-wizard-label');
    if (own) return own;
    const group = groupOf(field);
    if (group) return group.getAttribute('aria-label') || textOf(group.querySelector('legend')) || textOf(field.ownerDocument.getElementById(group.getAttribute('aria-labelledby') ?? ''));
    const labelled = field.getAttribute('aria-labelledby');
    if (labelled) return labelled.split(/\s+/).map((id) => textOf(field.ownerDocument.getElementById(id))).filter(Boolean).join(' ');
    return textOf(field.labels?.[0]) || field.getAttribute('aria-label') || field.name || '';
    }
    function groupOf(field) {
    if (field.type !== 'radio' && field.type !== 'checkbox') return null;
    if (field.type === 'checkbox' && !field.form?.querySelectorAll(`input[type="checkbox"][name=${quoted(field.name)}]`)[1]) return null;
    return field.closest('fieldset, [role="radiogroup"], [role="group"]');
    }
    function fieldValue(field, scope) {
    const root = scope ?? field.form ?? field.ownerDocument;
    if (field.tagName === 'SELECT') return [...field.selectedOptions].map((option) => option.textContent.trim()).filter(Boolean).join(', ');
    if (field.type === 'radio' || field.type === 'checkbox') {
    const peers = field.name ? [...root.querySelectorAll(`input[name=${quoted(field.name)}]`)] : [field];
    if (field.type === 'checkbox' && peers.length === 1) return field.checked ? t('wizardYes') : t('wizardNo');
    return peers.filter((peer) => peer.checked).map((peer) => textOf(peer.labels?.[0]) || peer.value).join(', ');
    }
    if (field.type === 'file') return [...(field.files ?? [])].map((file) => file.name).join(', ');
    if (field.type === 'password') return field.value ? '••••••••' : '';
    return field.value.trim();
    }
    const quoted = (name) => `"${String(name).replace(/["\\]/g, '\\$&')}"`;
    function controller(form, signal) {
    const doc = form.ownerDocument;
    const listeners = new Map();
    const panels = [...form.querySelectorAll('.ds-wizard__panel')];
    const steps = form.querySelector('.ds-wizard__steps');
    const back = form.querySelector('.ds-wizard__back');
    const next = form.querySelector('.ds-wizard__next');
    const submit = form.querySelector('.ds-wizard__submit');
    const status = panels.map(() => '');
    let index = Math.max(0, panels.findIndex((panel) => !panel.hidden));
    let errorSerial = 0;
    form.noValidate = true;
    for (const panel of panels) {
    const title = panel.querySelector('.ds-wizard__title');
    if (title && !title.hasAttribute('tabindex')) title.setAttribute('tabindex', '-1');
    if (!panel.id) panel.id = `ds-wizard-${++serial}`;
    }
    const notify = (type, detail, options) => {
    if (signal?.aborted) return true;
    const go = emit(form, type, detail, options);
    for (const fn of listeners.get(type) ?? []) fn(detail);
    return go;
    };
    const renderSteps = () => {
    if (!steps) return;
    const html = panels.map((panel, at) => {
    const label = esc(labelOf(panel));
    const state = status[at];
    const current = at === index;
    const optional = panel.hasAttribute('data-ds-wizard-optional') && !state && !current;
    const attrs = (state === 'error' ? ' data-status="error"' : state === 'done' ? ' data-status="done"' : optional ? ' data-status="optional"' : '') + (current ? ' aria-current="step"' : '');
    const mark = state === 'error' ? icon(alertCircle, 16) : state === 'done' ? icon(check, 16) : String(at + 1);
    const read = state === 'done' ? `<span class="ds-sr">, ${esc(t('wizardDone'))}</span>` : '';
    const hint = state === 'error' ? `<span class="ds-steps__hint">${esc(t('wizardFix'))}</span>` : optional ? `<span class="ds-steps__hint">${esc(t('optional'))}</span>` : '';
    return `<li class="ds-steps__step"${attrs}><span class="ds-steps__mark">${mark}</span><span class="ds-steps__label">${label}${read}</span>${hint}</li>`;
    }).join('');
    morphHtml(steps, html);
    if (steps.classList.contains('ds-steps--bar')) steps.setAttribute('aria-label', t('wizardStepOf', { index: index + 1, count: panels.length }));
    };
    const clearError = (field) => {
    const id = field.getAttribute('data-ds-wizard-error');
    if (!id) return;
    doc.getElementById(id)?.remove();
    field.removeAttribute('data-ds-wizard-error');
    field.removeAttribute('aria-invalid');
    const rest = (field.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((name) => name && name !== id);
    if (rest.length) field.setAttribute('aria-describedby', rest.join(' '));
    else field.removeAttribute('aria-describedby');
    };
    const showError = (field, message, peers) => {
    const id = `ds-wizard-error-${++errorSerial}`;
    const hint = doc.createElement('small');
    hint.className = 'ds-field__hint ds-field__hint--error ds-wizard__error';
    hint.id = id;
    hint.append(iconElement(alertCircle, 16, '', doc), doc.createTextNode(message));
    const group = groupOf(field);
    const holder = group ?? field.closest('.ds-field');
    if (holder) holder.append(hint);
    else (field.closest('label') ?? field).after(hint);
    for (const peer of peers) {
    peer.setAttribute('data-ds-wizard-error', id);
    peer.setAttribute('aria-invalid', 'true');
    peer.setAttribute('aria-describedby', [...(peer.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean), id].join(' '));
    }
    };
    const fieldsOf = (panel) => [...panel.querySelectorAll(FIELDS)].filter((field) => field.willValidate !== false && !field.disabled);
    const checkStep = (at, report = true) => {
    const panel = panels[at];
    if (!panel || panel.hasAttribute('data-ds-wizard-summary')) return true;
    const fields = fieldsOf(panel);
    for (const field of fields) clearError(field);
    const invalid = [];
    const done = new Set();
    for (const field of fields) {
    if (done.has(field) || field.checkValidity()) continue;
    const peers = (field.type === 'radio' || field.type === 'checkbox') && field.name
    ? fields.filter((other) => other.name === field.name && other.type === field.type)
    : [field];
    for (const peer of peers) done.add(peer);
    invalid.push(field);
    if (report) showError(field, field.validationMessage || t('valueRequired'), peers);
    }
    const page = notify('validate', { index: at, panel, invalid }, { cancelable: true });
    return !invalid.length && page;
    };
    const show = (to, direction, focus = true) => {
    const from = index;
    index = to;
    panels.forEach((panel, at) => {
    panel.hidden = at !== to;
    });
    if (panels[to].hasAttribute('data-ds-wizard-summary')) renderSummary(panels[to]);
    const last = to === panels.length - 1;
    if (back) back.hidden = to === 0;
    if (next) next.hidden = last;
    if (submit) submit.hidden = !last;
    renderSteps();
    if (from !== to) enter(panels[to], 'swap');
    if (focus && from !== to) {
    (panels[to].querySelector('.ds-wizard__title') ?? panels[to]).focus({ preventScroll: false });
    announce(t('wizardStep', { index: to + 1, count: panels.length, label: labelOf(panels[to]) }));
    }
    if (from !== to) notify('step', { index: to, from, direction, panel: panels[to] });
    };
    const fail = (at) => {
    status[at] = 'error';
    if (at !== index) show(at, 'back');
    else renderSteps();
    const marked = [...panels[at].querySelectorAll('[aria-invalid="true"]')];
    const outer = marked.filter((node) => !marked.some((other) => other !== node && other.contains(node)));
    const count = new Set(outer.map((node) => ((node.type === 'radio' || node.type === 'checkbox') && node.name ? `${node.type}:${node.name}` : node))).size;
    outer[0]?.focus();
    announce(count === 0 ? t('wizardFix') : count === 1 ? t('wizardError') : t('wizardErrors', { count }), { assertive: true });
    };
    const goTo = (to, direction) => {
    const target = Math.min(panels.length - 1, Math.max(0, to));
    if (target === index) return true;
    if (target > index) {
    for (let at = index; at < target; at += 1) {
    if (!checkStep(at)) {
    fail(at);
    return false;
    }
    status[at] = 'done';
    }
    }
    show(target, direction ?? (target > index ? 'forward' : 'back'));
    return true;
    };
    function renderSummary(panel) {
    const holder = panel.querySelector('.ds-wizard__summary');
    if (!holder) return;
    const at = panels.indexOf(panel);
    const html = panels.slice(0, at).filter((step) => !step.hasAttribute('data-ds-wizard-summary')).map((step) => {
    const seen = new Set();
    const rows = [];
    for (const field of step.querySelectorAll(FIELDS)) {
    if (field.getAttribute('data-ds-wizard-summary') === 'off' || field.disabled) continue;
    const key = (field.type === 'radio' || field.type === 'checkbox') && field.name ? `${field.type}:${field.name}` : field;
    if (seen.has(key)) continue;
    seen.add(key);
    const label = fieldLabel(field);
    if (!label) continue;
    const value = fieldValue(field, form);
    rows.push(`<div><dt>${esc(label)}</dt><dd${value ? '' : ' class="ds-muted"'}>${esc(value || t('wizardEmpty'))}</dd></div>`);
    }
    const name = labelOf(step);
    const stepAt = panels.indexOf(step);
    return `<section class="ds-wizard__group" data-ds-key="${esc(step.id)}"><div class="ds-wizard__group-head"><h4 class="ds-wizard__group-title">${esc(name)}</h4>` +
    `<button class="ds-btn ds-btn--text ds-sm ds-wizard__edit" type="button" data-ds-wizard-go="${stepAt}" aria-label="${esc(t('wizardEdit', { label: name }))}">${esc(t('wizardEditShort'))}</button></div>` +
    `<dl class="ds-facts ds-facts--rows">${rows.join('')}</dl></section>`;
    }).join('');
    morphHtml(holder, html);
    }
    back?.addEventListener('click', () => goTo(index - 1, 'back'), { signal });
    next?.addEventListener('click', () => goTo(index + 1, 'forward'), { signal });
    form.addEventListener('click', (event) => {
    const edit = event.target.closest?.('[data-ds-wizard-go]');
    if (!edit || !form.contains(edit)) return;
    goTo(Number(edit.getAttribute('data-ds-wizard-go')), 'back');
    }, { signal });
    form.addEventListener('submit', (event) => {
    if (index < panels.length - 1) {
    event.preventDefault();
    event.stopImmediatePropagation();
    goTo(index + 1, 'forward');
    return;
    }
    for (let at = 0; at < panels.length; at += 1) {
    if (checkStep(at)) continue;
    event.preventDefault();
    event.stopImmediatePropagation();
    fail(at);
    return;
    }
    status[index] = 'done';
    }, { signal, capture: true });
    const recheck = (event) => {
    const field = event.target;
    if (!field?.hasAttribute?.('data-ds-wizard-error')) return;
    const peers = (field.type === 'radio' || field.type === 'checkbox') && field.name
    ? [...form.querySelectorAll(`[name=${quoted(field.name)}][data-ds-wizard-error]`)]
    : [field];
    if (!field.checkValidity()) return;
    for (const peer of peers) clearError(peer);
    const at = panels.findIndex((panel) => panel.contains(field));
    if (status[at] === 'error' && !panels[at].querySelector('[aria-invalid="true"]')) {
    status[at] = '';
    renderSteps();
    }
    };
    form.addEventListener('input', recheck, { signal });
    form.addEventListener('change', recheck, { signal });
    show(index, 'forward', false);
    return {
    get() {
    return { index, count: panels.length, step: labelOf(panels[index]), panel: panels[index], status: [...status] };
    },
    set(to) {
    return goTo(Number(to));
    },
    go(to) {
    return goTo(Number(to));
    },
    next() {
    return goTo(index + 1, 'forward');
    },
    back() {
    return goTo(index - 1, 'back');
    },
    validate(at = index) {
    const ok = checkStep(at);
    if (!ok) fail(at);
    return ok;
    },
    on(type, fn) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(fn);
    return () => listeners.get(type)?.delete(fn);
    },
    destroy() {
    listeners.clear();
    },
    };
    }
    define('wizard', {
    attribute: 'data-ds-wizard',
    init(el, ctx) {
    return controller(el, ctx.signal);
    },
    });
    function create(form) {
    const handle = new AbortController();
    const api = controller(form, handle.signal);
    const destroy = api.destroy;
    api.destroy = () => {
    handle.abort();
    destroy();
    };
    return api;
    }

    return Object.freeze({
      fieldLabel: fieldLabel,
      fieldValue: fieldValue,
      create: create
    });
  });

  // DS.core's entry points at the top level; a copy already on the page keeps its own.
  ['init', 'get', 'define', 'config'].forEach(function (key) {
    if (DS[key] === undefined && DS.core[key] !== undefined) DS[key] = DS.core[key];
  });
  // window.DS and the warning are the first copy's business.
  if (first) return;
  versions[version] = DS;
  var current = root.DS;
  var warn = function (message) {
    if (root.console && typeof root.console.warn === 'function') root.console.warn(message);
  };
  if (current === undefined || current === null || (typeof current === 'object' && current.version === version)) root.DS = DS;
  else if (typeof current.version === 'string') warn('Z-Dash ' + version + ' loaded on a page that already runs ' + current.version + ': window.DS stays ' + current.version + '; this copy is ZDash.versions[\'' + version + '\'].');
  else warn('Z-Dash ' + version + ': window.DS already holds something else; it is left alone, this copy is ZDash.versions[\'' + version + '\'].');
})(typeof globalThis !== 'undefined' ? globalThis : this);
