# Independently replay a failed review-log clear

Use this checklist to verify one specific fail-closed behavior in the **current local browser demo**: if the browser refuses to delete saved review history, the current review acknowledgment must still be revoked and **simulated sending must be refused**. This does not test de-identification or authorize use with patient data.

Use only the built-in **fictional** examples. Do not paste clinical records, real identifiers, screenshots of private material, or production logs. The public first-release exhibit may not run the same code as the current repository.

## Desktop replay

1. With Node 22 or later, run `npm run demo` and open the local URL printed in the terminal. Start in a fresh browser context; no API key or network service is needed.
2. Select **03 / Known gaps**. Wait until the inspector says **NEEDS REVIEW**. Click **Mark as reviewed**, then **Try simulated send**. Before the failure, the page should say the simulated send is allowed and that no request was made.
3. Expand **Local review log**. Confirm it contains an entry for the fictional example.
4. In that tab's browser developer console, inject a **temporary, synthetic** deletion failure:

   ```js
   Storage.prototype.removeItem = () => { throw new Error('Synthetic clear denial') }
   ```

5. Click **Clear local review log**. The page should say **Unable to clear browser storage** and **Current acknowledgment revoked; saved entries may remain**. The fictional log entry should still be present. If needed, verify the stored metadata with `localStorage.getItem('redaction-inspector-reviews-v1')`; it must not contain note text.
6. Click **Try simulated send** again. It must now say **Send refused** (the review must be recorded again before sending). A prior allowed result is **not** sufficient evidence for this check.

Close the test tab or reload it to remove the temporary override. With normal storage restored, use **Clear local review log** to dispose of the fictional test entries.

## Touch replay

Repeat the same sequence with Chromium's device emulation set to **390 × 844**, **touch enabled**. Use taps for the review, log, clear and simulated-send controls. Apply the console override in the same emulated page *before* tapping **Clear local review log**.

An emulated touchscreen is **not** an independent physical-phone test. A real phone would need a way to inject the storage failure into the same locally served revision (for example, remote browser debugging). Simply opening the public first-release exhibit, or clearing normal storage successfully on a phone, does not verify the failure case.

## Evidence to record

Record the tested commit, browser and device mode, the **NEEDS REVIEW** state, successful fictional review and simulated send *before* denial, the storage-clear failure notice, retained log **metadata**, and the refused simulated send *after* denial. Check the browser console for unexpected errors. Keep screenshots and logs fictional-only.

For the automated counterpart, see `test/browser-flow.cjs`; CI exercises both desktop and simulated mobile touch failure paths. A green CI result or successful manual replay does **not** establish patient-data clearance.
