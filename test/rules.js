/**
 * Test the rules.
 */

// Settings:
const DEBUG = process.env.DEBUG || false;
const DEFAULT_PORT = 8001;
const PORT = process.env.PORT || DEFAULT_PORT;
const ENDPOINT = `http://localhost:${PORT}`;
// Native packages:
const pth = require('path');

// External packages:
const express = require('express');
const expect = require('expect.js');
const chai = require('chai').expect;

// Internal packages:
const validation = require('./validation');
const samples = require('./samples.json');
const validator = require('../lib/validator');
const sink = require('../lib/sink');
/**
 * Compare two arrays of "deliverer IDs" and check that they're equivalent.
 *
 * @param {Array} a1 - One array.
 * @param {Array} a2 - The other array.
 * @returns {Boolean} whether the two arrays contain exactly the same integers.
 */

const equivalentArray = function (a1, a2) {
    if (a1 && a2 && a1.length === a2.length) {
        let found = 0;
        for (let i = 0; i < a1.length; i++) {
            for (let j = 0; j < a2.length && found === i; j++) {
                if (a1[i] === a2[j]) {
                    found++;
                }
            }
        }
        return found === a1.length;
    }

    return false;
};

/**
 * Assert that metadata detected in a spec is equal to the expected values.
 *
 * @param {String} url - public URL of a spec.
 * @param {String} file - name of local file containing a spec (without path and without ".html" suffix).
 * @param {Object} expectedObject - values that are expected to be found.
 */

const compareMetadata = function (url, file, expectedObject) {
    const specberus = new validator.Specberus();
    const handler = new sink.Sink((data) => {
        throw new Error(data);
    });
    const thisFile = file ? `test/docs/metadata/${file}.html` : null;
    // const opts = {events: handler, url: url, file: thisFile};
    // test only local fixtures
    const opts = { events: handler, file: thisFile };

    it(`Should detect metadata for ${expectedObject.url}`, (done) => {
        handler.on('end-all', () => {
            chai(specberus)
                .to.have.property('meta')
                .to.have.property('profile')
                .equal(expectedObject.profile);
            chai(specberus)
                .to.have.property('meta')
                .to.have.property('title')
                .equal(expectedObject.title);
            chai(specberus)
                .to.have.property('meta')
                .to.have.property('docDate')
                .equal(expectedObject.docDate);
            chai(specberus)
                .to.have.property('meta')
                .to.have.property('thisVersion')
                .equal(expectedObject.url);
            chai(specberus)
                .to.have.property('meta')
                .to.have.property('latestVersion')
                .equal(expectedObject.latestVersion);
            chai(specberus)
                .to.have.property('meta')
                .to.have.property('previousVersion')
                .equal(expectedObject.previousVersion);
            chai(specberus)
                .to.have.property('meta')
                .to.have.property('editorNames');
            chai(specberus.meta.editorNames).to.satisfy((found) =>
                equivalentArray(found, expectedObject.editorNames)
            );
            chai(specberus)
                .to.have.property('meta')
                .to.have.property('delivererIDs');
            chai(specberus.meta.delivererIDs).to.satisfy((found) =>
                equivalentArray(found, expectedObject.delivererIDs)
            );
            chai(specberus)
                .to.have.property('meta')
                .to.have.property('editorIDs');
            chai(specberus.meta.editorIDs).to.satisfy((found) =>
                equivalentArray(found, expectedObject.editorIDs)
            );
            chai(specberus)
                .to.have.property('meta')
                .to.have.property('informative')
                .equal(expectedObject.informative);
            chai(specberus)
                .to.have.property('meta')
                .to.have.property('rectrack')
                .equal(expectedObject.rectrack);
            const optionalProperties = [
                'process',
                'editorsDraft',
                'implementationFeedbackDue',
                'prReviewsDue',
                'implementationReport',
                'errata',
            ];
            optionalProperties.forEach((p) => {
                if (Object.prototype.hasOwnProperty.call(expectedObject, p)) {
                    chai(specberus)
                        .to.have.property('meta')
                        .to.have.property(p)
                        .equal(expectedObject[p]);
                }
            });
            done();
        });
        specberus.extractMetadata(opts);
    });
};

describe('Basics', () => {
    const specberus = new validator.Specberus();

    describe('Method "extractMetadata"', () => {
        let i;

        it('Should exist and be a function', (done) => {
            chai(specberus)
                .to.have.property('extractMetadata')
                .that.is.a('function');
            done();
        });

        // if (!process || !process.env || (process.env.TRAVIS !== 'true' && !process.env.SKIP_NETWORK)) {
        //     for(i in samples) {
        //         compareMetadata(samples[i].url, null, samples[i]);
        //     }
        // }
        // else {
        //     for(i in samples) {
        //         compareMetadata(null, samples[i].file, samples[i]);
        //     }
        // }
        for (i in samples) {
            compareMetadata(null, samples[i].file, samples[i]);
        }
    });

    describe('Method "validate"', () => {
        it('Should exist and be a function', (done) => {
            chai(specberus).to.have.property('validate').that.is.a('function');
            done();
        });
    });
});

const tests = {
    // Categories
    dummy: {
        // Rules
        dahut: [
            // Tests
            { doc: 'dummy/simple.html' }, // pass test
            { doc: 'dummy/dahut.html', errors: ['dummy.dahut.not-found'] }, // fail test
            { doc: 'dummy/all.html', errors: ['dummy.dahut.not-found'] },
        ],
        h1: [
            { doc: 'dummy/simple.html' },
            { doc: 'dummy/h1.html', errors: ['dummy.h1.not-found'] },
            { doc: 'dummy/all.html', errors: ['dummy.h1.not-found'] },
        ],
        'h2-foo': [
            { doc: 'dummy/simple.html' },
            { doc: 'dummy/h2-foo.html', errors: ['dummy.h2-foo.not-found'] },
            { doc: 'dummy/all.html', errors: ['dummy.h2-foo.not-found'] },
        ],
    },
    echidna: {
        'todays-date': [
            {
                doc: 'echidna/fails-future-date.html',
                errors: ['echidna.todays-date.wrong-date'],
            },
        ],
    },
    headers: {
        'div-head': [
            { doc: 'headers/simple.html' },
            {
                doc: 'headers/fails.html',
                errors: ['headers.div-head.not-found'],
            },
        ],
        hr: [
            { doc: 'headers/simple.html' },
            { doc: 'headers/hr.html' },
            { doc: 'headers/fails.html', errors: ['headers.hr.not-found'] },
            { doc: 'headers/fails-too.html', errors: ['headers.hr.not-found'] },
        ],
        title: [
            { doc: 'headers/simple.html' },
            { doc: 'headers/fails.html', errors: ['headers.title.not-found'] },
        ],
        logo: [
            { doc: 'headers/simple.html' },
            { doc: 'headers/logo.html' },
            { doc: 'headers/fails.html', errors: ['headers.logo.not-found'] },
        ],
        'h1-title': [
            { doc: 'headers/simple.html' },
            {
                doc: 'headers/fails.html',
                errors: ['headers.h1-title.not-found'],
            },
            {
                doc: 'headers/h1-title.html',
                errors: ['headers.h1-title.not-match'],
            },
            { doc: 'headers/h1-title-complex.html' },
        ],
        dl: [
            {
                doc: 'headers/simple.html',
                config: { previousVersion: true, status: 'WD' },
                errors: [
                    'headers.dl.cant-retrieve',
                    'headers.dl.editor-missing-id',
                ],
            },
            {
                doc: 'headers/fails.html',
                config: { status: 'REC' },
                errors: [
                    'headers.dl.this-version',
                    'headers.dl.latest-version',
                    'headers.dl.not-found',
                    'headers.dl.editor-not-found',
                ],
            },
            {
                doc: 'headers/fails.html',
                config: { status: 'REC', previousVersion: true },
                errors: [
                    'headers.dl.this-version',
                    'headers.dl.latest-version',
                    'headers.dl.previous-version',
                    'headers.dl.not-found',
                    'headers.dl.editor-not-found',
                ],
            },
            {
                doc: 'headers/dl-order.html',
                errors: [
                    'headers.dl.this-latest-order',
                    'headers.dl.latest-previous-order',
                    'headers.dl.cant-retrieve',
                    'headers.dl.implelink-should-be-https',
                    'headers.dl.editors-draft-should-be-https',
                ],
                warnings: ['headers.dl.previous-not-needed'],
            },
            {
                doc: 'headers/dl-mismatch.html',
                config: { status: 'REC' },
                errors: [
                    'headers.dl.link-diff',
                    'headers.dl.this-syntax',
                    'headers.dl.link-diff',
                    'headers.dl.latest-syntax',
                    'headers.dl.link-diff',
                    'headers.dl.previous-syntax',
                    'headers.dl.not-found',
                    'headers.dl.editor-not-found',
                ],
                warnings: ['headers.dl.previous-not-needed'],
            },
            {
                doc: 'headers/wrong-urls.html',
                errors: [
                    'headers.dl.previous-syntax',
                    'headers.dl.cant-retrieve',
                ],
                config: { previousVersion: true, status: 'WD' },
            },
            {
                doc: 'headers/dl-trailing-whitespace.html',
                config: { previousVersion: true, status: 'WD' },
                errors: ['headers.dl.cant-retrieve'],
            },
            {
                doc: 'headers/dl-untrimmed-text.html',
                config: { previousVersion: true, status: 'WD' },
                errors: ['headers.dl.cant-retrieve'],
            },
            {
                doc: 'headers/shortnameChange.html',
                config: { previousVersion: true, status: 'WD' },
                warnings: ['headers.dl.this-previous-shortname'],
            },
            {
                doc: 'headers/wg-note.html',
                config: { previousVersion: true, status: 'NOTE' },
                errors: ['headers.dl.previous-version'],
            },
            { doc: 'headers/wg-note.html', config: { status: 'NOTE' } },
            {
                doc: 'headers/seriesShortlink.html',
                config: { previousVersion: true, status: 'WD' },
                errors: ['headers.dl.cant-retrieve'],
            },
        ],
        'mailing-list': [
            {
                doc: 'headers/simple.html',
                errors: ['headers.mailing-list.no-repo'],
            },
            {
                doc: 'sotd/ml-bad.html',
                errors: ['headers.mailing-list.no-repo'],
                warnings: [
                    'headers.mailing-list.no-list',
                    'headers.mailing-list.no-arch',
                ],
            },
            { doc: 'sotd/ml-missing.html' },
        ],
        errata: [
            {
                doc: 'headers/simple.html',
                config: { longStatus: 'Recommendation' },
            },
            {
                doc: 'headers/simple-oxford.html',
                config: { longStatus: 'Recommendation' },
                errors: ['headers.errata.link-should-be-https'],
            },
        ],
        'h2-status': [
            {
                doc: 'headers/simple.html',
                config: { longStatus: 'Working Draft' },
            },
            {
                doc: 'headers/h2-comma.html',
                config: { longStatus: 'Working Draft' },
            },
            {
                doc: 'headers/simple.html',
                config: { longStatus: 'Recommendation' },
                errors: ['headers.h2-status.bad-h2'],
            },
            {
                doc: 'headers/h2-amended.html',
                config: { longStatus: 'Recommendation', amended: true },
            },
            {
                doc: 'headers/simple.html',
                config: { longStatus: 'Working Draft', amended: true },
                errors: ['headers.h2-status.bad-h2'],
            },
            {
                doc: 'headers/h2-not-found.html',
                errors: ['headers.h2-status.no-h2'],
                config: { longStatus: 'Working Draft' },
            },
            {
                doc: 'sotd/cr-end.html',
                config: {
                    longStatus: 'Candidate Recommendation',
                    crType: 'Snapshot',
                },
            },
            {
                doc: 'sotd/cr-end-27days.html',
                config: {
                    longStatus: 'Candidate Recommendation',
                    crType: 'Draft',
                },
            },
            {
                doc: 'sotd/cr-end-27days.html',
                config: {
                    longStatus: 'Candidate Recommendation',
                    crType: 'Snapshot',
                },
                errors: ['headers.h2-status.bad-h2'],
            },
            {
                doc: 'sotd/cr-end-multiple.html',
                config: {
                    longStatus: 'Candidate Recommendation',
                    crType: 'Snapshot',
                },
                errors: [
                    'headers.h2-status.bad-h2',
                    'headers.h2-status.bad-h2',
                ],
            },
        ],
        'h2-toc': [
            { doc: 'headers/simple.html' },
            { doc: 'headers/fails.html', errors: ['headers.h2-toc.not-found'] },
        ],
        'ol-toc': [
            { doc: 'headers/proper-toc.html' },
            {
                doc: 'headers/fails.html',
                warnings: ['headers.ol-toc.not-found'],
            },
        ],
        secno: [
            { doc: 'headers/proper-secno.html' },
            {
                doc: 'headers/fails.html',
                warnings: ['headers.secno.not-found'],
            },
        ],
        copyright: [
            { doc: 'headers/simple.html' },
            { doc: 'headers/simple-oxford.html' },
            {
                doc: 'headers/copyright-freedom.html',
                warnings: ['headers.copyright.kitten-friendly'],
            },
            {
                doc: 'headers/fails.html',
                errors: ['headers.copyright.not-found'],
            },
            { doc: 'headers/permissive-doc-license.html' },
        ],
    },
    style: {
        sheet: [
            { doc: 'headers/simple.html', config: { styleSheet: 'W3C-WD' } },
            {
                doc: 'headers/fails.html',
                config: { styleSheet: 'W3C-WD' },
                errors: ['style.sheet.not-found'],
            },
            {
                doc: 'style/style-not-last.html',
                config: { styleSheet: 'W3C-WD' },
                errors: ['style.sheet.not-found'],
            },
        ],
        meta: [
            { doc: 'dummy/simple.html', errors: ['style.meta.not-found'] },
            { doc: 'style/simple.html' },
            { doc: 'style/wrong-meta.html', errors: ['style.meta.not-found'] },
        ],
        script: [
            { doc: 'headers/simple.html', errors: ['style.script.not-found'] },
            { doc: 'headers/fixup.html' },
        ],
        'back-to-top': [
            {
                doc: 'headers/simple.html',
                warnings: ['style.back-to-top.not-found'],
            },
            { doc: 'headers/back-to-top.html' },
        ],
        'body-toc-sidebar': [
            { doc: 'style/simple.html' },
            {
                doc: 'style/wrong-meta.html',
                errors: ['style.body-toc-sidebar.class-found'],
            },
        ],
    },
    links: {
        internal: [
            { doc: 'links/internal-good.html' },
            {
                doc: 'links/internal-fails.html',
                errors: ['links.internal.anchor', 'links.internal.anchor'],
            },
        ],
        reliability: [
            {
                doc: 'links/internal-fails.html',
                warnings: [
                    // w3c-test.org is not reliable
                    'links.reliability.unreliable-link',
                    'links.reliability.unreliable-link',
                    'links.reliability.unreliable-link',
                    'links.reliability.unreliable-link',
                    // w3.org/Bugs is not reliable
                    'links.reliability.unreliable-link',
                    'links.reliability.unreliable-link',
                    'links.reliability.unreliable-link',
                    'links.reliability.unreliable-link',
                    // dev.w3.org, dvcs.w3.org are not reliable
                    'links.reliability.unreliable-link',
                    'links.reliability.unreliable-link',
                    'links.reliability.unreliable-link',
                    'links.reliability.unreliable-link',
                    // tools.ietf.org is not reliable
                    'links.reliability.unreliable-link',
                    'links.reliability.unreliable-link',
                ],
            },
        ],
        linkchecker: [
            {
                url: 'links/external-resources.html',
                errors: [
                    'links.linkchecker.not-same-folder',
                    'links.linkchecker.not-same-folder',
                ],
                warnings: ['links.linkchecker.display'],
            },
            {
                url: 'links/broken-resources.html',
                errors: ['links.linkchecker.response-error'],
                warnings: ['links.linkchecker.display'],
            },
            {
                url: 'links/redirect-resources.html',
                errors: ['links.linkchecker.response-error-with-redirect'],
                warnings: ['links.linkchecker.display'],
            },
        ],
    },
    structure: {
        h2: [
            { doc: 'headers/simple.html' },
            {
                doc: 'structure/h2-abstract.html',
                errors: ['structure.h2.abstract'],
            },
            {
                doc: 'structure/h2-sotd.html',
                errors: ['structure.h2.abstract', 'structure.h2.sotd'],
            },
            {
                doc: 'structure/h2-toc.html',
                errors: [
                    'structure.h2.abstract',
                    'structure.h2.sotd',
                    'structure.h2.toc',
                ],
            },
        ],
        'section-ids': [
            { doc: 'structure/sid-ok.html' },
            {
                doc: 'structure/sid-all-wrong.html',
                errors: [
                    'structure.section-ids.no-id',
                    'structure.section-ids.no-id',
                    'structure.section-ids.no-id',
                    'structure.section-ids.no-id',
                    'structure.section-ids.no-id',
                    'structure.section-ids.no-id',
                ],
            },
        ],
        canonical: [
            { doc: 'headers/simple.html' },
            { doc: 'structure/canonical.html' },
            {
                doc: 'structure/canonical-missing.html',
                errors: ['structure.canonical.not-found'],
            },
            {
                doc: 'structure/canonical-href-missing.html',
                errors: ['structure.canonical.not-found'],
            },
        ],
        neutral: [
            {
                doc: 'structure/unneutral.html',
                warnings: ['structure.neutral.neutral'],
            },
            {
                doc: 'structure/unneutral2.html',
                warnings: ['structure.neutral.neutral'],
            },
            {
                doc: 'structure/unneutral3.html',
                warnings: ['structure.neutral.neutral'],
            },
            { doc: 'structure/neutral.html' },
            {
                doc: 'structure/canonical.html',
                warnings: ['structure.neutral.neutral'],
            },
        ],
    },
    sotd: {
        'rec-addition': [
            { doc: 'sotd/rec-addition-2020.html' },
            {
                doc: 'sotd/rec-obsl.html',
                errors: [
                    'sotd.rec-addition.no-addition',
                    'sotd.rec-addition.no-correction',
                ],
            },
            {
                doc: 'sotd/rec-rescind.html',
                errors: [
                    'sotd.rec-addition.wrong-text',
                    'sotd.rec-addition.wrong-text',
                ],
            },
            {
                doc: 'sotd/cr-end.html',
                errors: [
                    'sotd.rec-addition.unnecessary-correction',
                    'sotd.rec-addition.unnecessary-addition',
                ],
            },
        ],
        'rec-comment-end': [
            { doc: 'sotd/rec-addition-2020.html' },
            {
                doc: 'sotd/rec-obsl.html',
                errors: ['sotd.rec-comment-end.not-found'],
            },
            {
                doc: 'sotd/rec-rescind.html',
                warnings: ['sotd.rec-comment-end.multi-found'],
            },
        ],
        publish: [
            {
                doc: 'sotd/cr-end.html',
                config: { status: 'CR', crType: 'Snapshot' },
            },
            {
                doc: 'sotd/cr-end-27days.html',
                config: { status: 'CRD', crType: 'Draft' },
            },
            {
                doc: 'sotd/cr-end.html',
                config: { status: 'CR', crType: 'Draft' },
                errors: ['sotd.publish.not-found'],
            },
            {
                doc: 'sotd/rec-obsl.html',
                config: { status: 'REC', longStatus: 'Recommendation' },
            },
            {
                doc: 'sotd/rec-rescind.html',
                config: { status: 'REC', longStatus: 'Recommendation' },
                errors: ['sotd.publish.url-not-match'],
            },
            {
                doc: 'sotd/rec-superseded.html',
                config: { status: 'REC', longStatus: 'Recommendation' },
                errors: ['sotd.publish.url-text-not-found'],
            },
            {
                doc: 'sotd/rec-publish-corrections-pass.html',
                config: { status: 'REC', longStatus: 'Recommendation' },
            },
            {
                doc: 'sotd/rec-publish-corrections-fail.html',
                config: { status: 'REC', longStatus: 'Recommendation' },
                errors: ['sotd.publish.url-not-match'],
            },
            {
                doc: 'sotd/rec-publish-corrections-fail2.html',
                config: { status: 'REC', longStatus: 'Recommendation' },
                errors: ['sotd.publish.url-text-not-found'],
            },
        ],
        'new-features': [
            { doc: 'sotd/rec-addition-2020.html', config: { status: 'REC' } },
            {
                doc: 'sotd/rec-addition-2020.html',
                config: { status: 'PR' },
                warnings: ['sotd.new-features.no-warning'],
            },
            {
                doc: 'sotd/cr-end-nodate.html',
                config: { status: 'REC' },
                errors: ['sotd.new-features.no-link'],
            },
        ],
        'draft-stability': [
            {
                doc: 'headers/simple.html',
                config: { longStatus: 'Working Draft' },
            },
            {
                doc: 'headers/wd.html',
                config: { status: 'WD', longStatus: 'Working Draft' },
            },
            {
                doc: 'headers/wd.html',
                config: {
                    status: 'CR',
                    longStatus: 'Candidate Recommendation',
                },
            },
            {
                doc: 'sotd/rec-addition-2020.html',
                config: { stabilityWarning: 'REC' },
            },
            { doc: 'sotd/rec-obsl.html', config: { stabilityWarning: 'REC' } },
            {
                doc: 'sotd/cr-end-27days.html',
                config: {
                    crType: 'Snapshot',
                    longStatus: 'Candidate Recommendation',
                },
            },
            {
                doc: 'sotd/cr-end-multiple.html',
                config: {
                    crType: 'Snapshot',
                    longStatus: 'Candidate Recommendation',
                },
            },
            {
                doc: 'online/WD-screen-orientation.html',
                config: { longStatus: 'Working Draft', stabilityWarning: true },
            },
            { doc: 'sotd/cr-end.html' },
        ],
        supersedable: [
            { doc: 'headers/simple.html' },
            {
                doc: 'sotd/supersedable.html',
                errors: [
                    'sotd.supersedable.no-sotd-intro',
                    'sotd.supersedable.no-sotd-tr',
                ],
            },
        ],
        pp: [
            {
                doc: 'headers/simple.html',
                config: { recTrackStatus: true },
                errors: ['sotd.pp.undefined'],
            },
            {
                doc: 'sotd/pp-bad.html',
                config: { recTrackStatus: true, patentPolicy: 'pp2004' },
                errors: ['sotd.pp.no-pp'],
            },
            {
                doc: 'sotd/pp-cpp2002.html',
                options: { patentPolicy: 'pp2002' },
            },
            {
                doc: 'sotd/joint-publication-bad-pp-version.html',
                config: {
                    recTrackStatus: true,
                    noRecTrack: false,
                    patentPolicy: 'pp2004',
                },
                errors: ['sotd.pp.no-pp'],
                warnings: ['sotd.pp.joint-publication'],
            },
            {
                doc: 'sotd/joint-publication-good.html',
                config: {
                    recTrackStatus: true,
                    noRecTrack: false,
                    patentPolicy: 'pp2004',
                },
                warnings: ['sotd.pp.joint-publication'],
            },
            {
                doc: 'sotd/joint-publication-tag.html',
                config: { recTrackStatus: true, patentPolicy: 'pp2004' },
            },
            {
                doc: 'sotd/joint-publication-fail.html',
                config: { recTrackStatus: true, patentPolicy: 'pp2004' },
                errors: ['sotd.pp.no-pp'],
            },
            {
                doc: 'headers/wg-note.html',
                config: {
                    longStatus: 'Working Group Note',
                    patentPolicy: 'pp2004',
                },
            },
            {
                doc: 'headers/wg-note1.html',
                config: {
                    longStatus: 'Working Group Note',
                    patentPolicy: 'pp2004',
                },
            },
            {
                doc: 'headers/wg-note2.html',
                config: {
                    longStatus: 'Working Group Note',
                    patentPolicy: 'pp2004',
                },
            },
            {
                doc: 'sotd/pp-20170801.html',
                config: {
                    recTrackStatus: true,
                    patentPolicy: 'pp2004',
                    amended: true,
                },
                errors: ['sotd.pp.no-pp'],
            },
            {
                doc: 'sotd/pp-20170801-amended.html',
                config: { recTrackStatus: true, patentPolicy: 'pp2004' },
                errors: ['sotd.pp.no-pp'],
            },
            {
                doc: 'sotd/pp-20170801-amended.html',
                config: {
                    recTrackStatus: true,
                    patentPolicy: 'pp2004',
                    amended: true,
                },
            },
            {
                doc: 'sotd/pp-20200915.html',
                config: { recTrackStatus: true, patentPolicy: 'pp2020' },
            },
            {
                doc: 'sotd/pp-20200915.html',
                config: { recTrackStatus: true },
                errors: ['sotd.pp.undefined'],
            },
            {
                doc: 'sotd/pp-20200915-iprlink.html',
                config: { recTrackStatus: true, patentPolicy: 'pp2020' },
            },
            { doc: 'headers/wd.html' },
            {
                doc: 'sotd/wg-note-IG-good.html',
                config: {
                    longStatus: 'Working Group Note',
                    patentPolicy: 'pp2004',
                },
            },
            {
                doc: 'sotd/wg-note-IG-bad.html',
                config: {
                    longStatus: 'Working Group Note',
                    patentPolicy: 'pp2004',
                },
                errors: ['sotd.pp.no-pp'],
            },
        ],
        'charter-disclosure': [
            { doc: 'headers/ig-note.html' },
            {
                doc: 'online/IG-NOTE-media-timed-events.html',
                errors: ['sotd.charter-disclosure.wrong-link'],
            },
            {
                doc: 'online/IG-NOTE-media-timed-events.html',
                errors: ['sotd.charter-disclosure.wrong-link'],
            },
            {
                doc: 'headers/ig-note2.html',
                errors: ['sotd.charter-disclosure.no-group'],
            },
            {
                doc: 'headers/ig-note3.html',
                errors: ['sotd.charter-disclosure.text-not-found'],
            },
        ],
        stability: [
            {
                doc: 'headers/simple.html',
                config: { longStatus: 'Working Draft', stabilityWarning: true },
            },
            {
                doc: 'headers/simple.html',
                config: { longStatus: 'Rock And Roll', stabilityWarning: true },
                errors: ['sotd.stability.no-stability'],
            },
            {
                doc: 'sotd/supersedable.html',
                config: {
                    longStatus: 'Rock And Roll',
                    stabilityWarning: false,
                },
            },
            {
                doc: 'headers/ig-note.html',
                config: {
                    longStatus: 'Interest Group Note',
                    stabilityWarning: true,
                },
            },
            {
                doc: 'headers/wg-note.html',
                config: {
                    longStatus: 'Working Group Note',
                    stabilityWarning: true,
                },
                errors: ['sotd.stability.no-stability'],
            },
            {
                doc: 'headers/wg-note1.html',
                config: {
                    longStatus: 'Working Group Note',
                    stabilityWarning: true,
                },
            },
            {
                doc: 'headers/wg-note2.html',
                config: {
                    longStatus: 'Working Group Note',
                    stabilityWarning: true,
                },
            },
            {
                doc: 'headers/wd.html',
                config: {
                    status: 'WD',
                    longStatus: 'Working Draft',
                    stabilityWarning: true,
                },
            },
            {
                doc: 'headers/wd.html',
                config: {
                    status: 'CR',
                    longStatus: 'Candidate Recommendation',
                    stabilityWarning: true,
                },
                errors: ['sotd.stability.no-stability'],
            },
            {
                doc: 'sotd/rec-addition-2020.html',
                config: { stabilityWarning: 'REC' },
            },
            {
                doc: 'sotd/rec-obsl.html',
                config: { stabilityWarning: 'REC' },
                errors: ['sotd.stability.no-rec-review'],
            },
            {
                doc: 'sotd/cr-end-27days.html',
                config: {
                    crType: 'Snapshot',
                    stabilityWarning: true,
                    longStatus: 'Candidate Recommendation',
                },
                errors: ['sotd.stability.no-cr-review'],
            },
            {
                doc: 'sotd/cr-end-multiple.html',
                config: {
                    crType: 'Snapshot',
                    stabilityWarning: true,
                    longStatus: 'Candidate Recommendation',
                },
                errors: ['sotd.stability.wrong-cr-review-link'],
            },
            {
                doc: 'online/WG-NOTE-lpf.html',
                config: {
                    longStatus: 'Working Group Note',
                    stabilityWarning: true,
                },
            },
            {
                doc: 'online/WD-screen-orientation.html',
                config: { longStatus: 'Working Draft', stabilityWarning: true },
            },
            {
                doc: 'online/IG-NOTE-media-timed-events.html',
                config: {
                    longStatus: 'Interest Group Note',
                    stabilityWarning: true,
                },
            },
        ],
        'ac-review': [
            { doc: 'sotd/supersedable.html' },
            { doc: 'sotd/pp-bad.html', errors: ['sotd.ac-review.not-found'] },
        ],
        'process-document': [
            { doc: 'sotd/process2019.html' },
            { doc: 'sotd/rec-addition-2020.html' },
            {
                doc: 'sotd/process2019-not-allowed.html',
                errors: [
                    'sotd.process-document.wrong-process',
                    'sotd.process-document.not-found',
                ],
            },
            {
                doc: 'sotd/wrongprocess.html',
                errors: [
                    'sotd.process-document.wrong-process',
                    'sotd.process-document.not-found',
                ],
            },
        ],
        'group-homepage': [
            { doc: 'sotd/group-homepage.html' },
            { doc: 'sotd/group-homepage-https.html' },
            {
                doc: 'sotd/group-homepage-wrong.html',
                errors: ['sotd.group-homepage.no-homepage'],
            },
            { doc: 'headers/ig-note.html' },
        ],
        'obsl-rescind': [
            { doc: 'sotd/rec-obsl.html', config: { obsoletes: true } },
            { doc: 'sotd/rec-rescind.html', config: { rescinds: true } },
            { doc: 'sotd/rec-superseded.html', config: { supersedes: true } },
            {
                doc: 'sotd/rec-rescind.html',
                config: { obsoletes: true },
                errors: ['sotd.obsl-rescind.no-rationale'],
            },
            {
                doc: 'sotd/rec-obsl.html',
                config: { rescinds: true },
                errors: ['sotd.obsl-rescind.no-rationale'],
            },
            {
                doc: 'sotd/rec-superseded.html',
                config: { supersedes: false },
                errors: ['sotd.obsl-rescind.no-rationale'],
            },
        ],
        'deliverer-note': [
            { doc: 'sotd/note-deliverer.html', config: { status: 'WG-NOTE' } },
            {
                doc: 'sotd/note-deliverer-bad.html',
                config: { status: 'WG-NOTE' },
                errors: ['sotd.deliverer-note.not-found'],
            },
        ],
        'cr-end': [
            {
                doc: 'metadata/cr-mediacapture-streams.html',
                config: { status: 'CR' },
            },
            {
                doc: 'metadata/cr-mediacapture-streams.html',
                config: { status: 'CR', editorial: true },
                warnings: ['sotd.cr-end.editorial'],
            },
            { doc: 'sotd/cr-end.html', config: { status: 'CR' } },
            {
                doc: 'sotd/cr-end-27days.html',
                config: { status: 'CR' },
                errors: ['sotd.cr-end.not-found'],
            },
            {
                doc: 'sotd/cr-end-multiple.html',
                config: { status: 'CR' },
                warnings: ['sotd.cr-end.multiple-found'],
            },
            {
                doc: 'sotd/cr-end-nodate.html',
                config: { status: 'CR' },
                errors: ['sotd.cr-end.found-not-valid'],
            },
        ],
    },
    heuristic: {
        'date-format': [
            { doc: 'heuristic/dates.html' },
            {
                doc: 'heuristic/bad-dates.html',
                errors: [
                    'heuristic.date-format.wrong',
                    'heuristic.date-format.wrong',
                ],
            },
            { doc: 'heuristic/dated-url.html' },
        ],
        shortname: [
            { doc: 'headers/simple.html' },
            { doc: 'headers/diff-latest-version.html' },
            {
                doc: 'headers/diff-latest-version.html',
                config: { previousVersion: false },
            },
            {
                doc: 'metadata/tracking-compliance.html',
                config: { previousVersion: false },
                errors: ['heuristic.shortname.shortname-duplicate'],
            },
        ],
    },
    validation,
};

// start an server to host doc, response to sr.url requests
const app = express();
app.use('/docs', express.static(pth.join(__dirname, 'docs')));
const expressServer = app.listen(PORT, () => {});

// config single redirection
app.get('/docs/links/image/logo', (req, res) => {
    res.redirect('/docs/links/image/logo.png');
});
// config single redirection to no where (404)
app.get('/docs/links/image/logo-fail', (req, res) => {
    res.redirect('/docs/links/image/logo-fail.png');
});
// config multiple redirection
app.get('/docs/links/image/logo-redirection-1', (req, res) => {
    res.redirect(301, '/docs/links/image/logo-redirection-2');
});
app.get('/docs/links/image/logo-redirection-2', (req, res) => {
    res.redirect(307, '/docs/links/image/logo-redirection-3');
});
app.get('/docs/links/image/logo-redirection-3', (req, res) => {
    res.redirect('/docs/links/image/logo.png');
});

describe('Making sure Specberus is not broken...', () => {
    after(() => {
        expressServer.close();
    });
    Object.keys(tests).forEach((category) => {
        describe(`Category ${category}`, () => {
            Object.keys(tests[category]).forEach((rule) => {
                describe(`Rule ${rule}`, () => {
                    tests[category][rule].forEach((test) => {
                        const passTest = !test.errors;
                        it(`should ${passTest ? 'pass' : 'fail'} for ${
                            test.doc || test.url
                        }`, (done) => {
                            // eslint-disable-next-line import/no-dynamic-require
                            const r = require(`../lib/rules/${category}/${rule}`);
                            const handler = new sink.Sink();
                            handler.on('err', (type, data) => {
                                if (DEBUG) console.log(type, data);
                                handler.errors.push(`${type.name}.${data.key}`);
                            });
                            handler.on('warning', (type, data) => {
                                if (DEBUG) console.log('[W]', data);
                                handler.warnings.push(
                                    `${type.name}.${data.key}`
                                );
                            });
                            handler.on('done', () => {
                                if (DEBUG) console.log('---done---');
                                handler.done++;
                            });
                            handler.on('exception', (data) => {
                                console.error(
                                    `[EXCEPTION] Validator had a massive failure: ${data.message}`
                                );
                            });
                            handler.on('end-all', () => {
                                try {
                                    let i;
                                    let n;
                                    if (passTest) {
                                        expect(handler.errors).to.be.empty();
                                    } else {
                                        expect(handler.errors.length).to.eql(
                                            test.errors.length
                                        );
                                        for (
                                            i = 0, n = test.errors.length;
                                            i < n;
                                            i++
                                        ) {
                                            expect(handler.errors).to.contain(
                                                test.errors[i]
                                            );
                                        }
                                    }
                                    if (!test.ignoreWarnings) {
                                        if (test.warnings) {
                                            expect(
                                                handler.warnings.length
                                            ).to.eql(test.warnings.length);
                                            for (
                                                i = 0, n = test.warnings.length;
                                                i < n;
                                                i++
                                            ) {
                                                expect(
                                                    handler.warnings
                                                ).to.contain(test.warnings[i]);
                                            }
                                        } else {
                                            expect(
                                                handler.warnings
                                            ).to.be.empty();
                                        }
                                    }
                                    done();
                                } catch (e) {
                                    return done(e);
                                }
                            });
                            const profile = {
                                name: `Synthetic ${category}/${rule}`,
                                rules: [r],
                            };
                            profile.config = test.config;
                            const options = {
                                profile,
                                events: handler,
                            };

                            // support both external urls and local files
                            if (test.url)
                                options.url = `${ENDPOINT}/docs/${test.url}`;
                            else
                                options.file = pth.join(
                                    __dirname,
                                    'docs',
                                    test.doc
                                );

                            for (const o in test.options)
                                options[o] = test.options[o];
                            new validator.Specberus().validate(options);
                        });
                    });
                });
            });
        });
    });
});
