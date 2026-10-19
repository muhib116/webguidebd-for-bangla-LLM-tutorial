<?php
/**
 * Uninstall does NOT delete course/learner data by default.
 * Destructive purge would require a future explicit admin tool.
 *
 * @package WebGuideBD\AIAcademy
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

// Intentionally empty: preserve CPT posts and wgba_* tables.
