<?php
/**
 * Shared HTML builder for lesson contract sections.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

/**
 * @param array<string,mixed> $s Sections.
 */
function wgba_lesson_html( array $s ): string {
	$h = static function ( string $html ): string {
		return $html;
	};

	$parts = array();
	$parts[] = '<section class="wgba-section" id="problem"><h2>সমস্যাটা কী?</h2>' . $s['problem'] . '</section>';
	$parts[] = '<section class="wgba-section" id="objectives"><h2>শেখার লক্ষ্য</h2><ul>' .
		implode( '', array_map( static fn( $o ) => '<li>' . esc_html( (string) $o ) . '</li>', (array) ( $s['objectives'] ?? array() ) ) ) .
		'</ul><p class="wgba-meta">আনুমানিক সময়: ' . (int) ( $s['minutes'] ?? 20 ) . ' মিনিট</p></section>';
	if ( ! empty( $s['prereq_html'] ) ) {
		$parts[] = '<section class="wgba-section" id="prereq"><h2>পূর্বশর্ত</h2>' . $s['prereq_html'] . '</section>';
	}
	$parts[] = '<section class="wgba-section" id="explain"><h2>ব্যাখ্যা</h2>' . $s['explain'] . '</section>';
	$parts[] = '<section class="wgba-section" id="analogy"><h2>উপমা — এবং কোথায় ভাঙে</h2>' . $s['analogy'] . '</section>';
	$parts[] = '<section class="wgba-section" id="worked"><h2>ধাপে ধাপে উদাহরণ</h2>' . $s['worked'] . '</section>';
	if ( ! empty( $s['activity'] ) ) {
		$parts[] = '<section class="wgba-section" id="activity"><h2>অনুশীলন / অ্যাক্টিভিটি</h2>' . $s['activity'] . '</section>';
	}
	$parts[] = '<details class="wgba-disclose"><summary>লাইন ধরে বুঝি</summary><div>' . ( $s['line_by_line'] ?? '<p>এই পাঠে মূল ধারণা ব্যাখ্যাই প্রাধান্য।</p>' ) . '</div></details>';
	$parts[] = '<details class="wgba-disclose"><summary>এখানে এটা কেন ব্যবহার করেছি?</summary><div>' . ( $s['why'] ?? '' ) . '</div></details>';
	$parts[] = '<details class="wgba-disclose"><summary>কোন বিষয়গুলো মনে রাখব?</summary><div>' . ( $s['remember'] ?? '' ) . '</div></details>';
	$parts[] = '<details class="wgba-disclose"><summary>এখনই কোনগুলো মুখস্থ করতে হবে না?</summary><div>' . ( $s['skip_memorize'] ?? '' ) . '</div></details>';
	if ( ! empty( $s['experiment'] ) ) {
		$parts[] = '<details class="wgba-disclose" open><summary>নিজে পরিবর্তন করে দেখুন</summary><div>' . $s['experiment'] . '</div></details>';
	}
	$parts[] = '<section class="wgba-section" id="mistakes"><h2>সাধারণ ভুল</h2>' . $s['mistakes'] . '</section>';
	$parts[] = '<section class="wgba-section" id="check"><h2>জ্ঞান যাচাই</h2>' . $s['check'] . '</section>';
	$parts[] = '<section class="wgba-section" id="recap"><h2>সংক্ষেপে মনে রাখুন</h2>' . $s['recap'] . '</section>';
	$parts[] = '<section class="wgba-section" id="next"><h2>পরবর্তী পাঠ</h2>' . $s['next'] . '</section>';
	$parts[] = '<section class="wgba-section" id="sources"><h2>সূত্র ও যাচাই</h2>' . $s['sources'] . '</section>';
	return implode( "\n", $parts );
}
