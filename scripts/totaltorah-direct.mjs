/*
 * totaltorah-direct.mjs — Total Torah verses Cantor Arianne Brown recorded and sent directly, outside the video
 * series (a verse the series never chants). Hand-kept: build-totaltorah-bulk.mjs adas rewrites totaltorah-videos.mjs,
 * never this file. build-totaltorah-direct.mjs cuts each recording into verse files exactly as split does for a
 * video; the manifest entry carries `video: null, direct: "<id>"`, so the Trainer credits Cantor Brown and Adas
 * Israel with no YouTube link (there is no complete video to link to), and the Trope Tutor's example index, which
 * needs a video link, leaves the verses out.
 *
 * <id>: { ref, parsha, year, aliyah, recorded (YYYY-MM-DD), intro (s: where the cut starts — before the chant's first
 *         sound; a phone memo opens with the tap that started it, and the aligner parks the first word on that tap
 *         when it is left in), note }
 * The source file sits in source-data/totaltorah-cache/<id>.m4a (gitignored), like a video's audio.
 */
export const DIRECT = {
  'direct-gen-028-005': {
    ref: 'Genesis 28:5-28:6', parsha: 'Toldot', year: 3, aliyah: 7, recorded: '2026-10-28', intro: 2.45,   // a tap at 0.6 s, the chant from 2.64 s (maintainer: trim the start)
    note: 'the two verses of Toldot Y3 A7 that its video (-CmdgOZKR14) does not chant: recorded by Cantor Brown on a phone and sent to the maintainer, October 2026',
  },
};
