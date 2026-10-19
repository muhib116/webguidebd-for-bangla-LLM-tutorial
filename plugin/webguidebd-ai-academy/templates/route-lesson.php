<?php
/**
 * Lesson page — W3Schools-style sidenav + prev/next.
 *
 * @package WebGuideBD\AIAcademy
 */

defined( 'ABSPATH' ) || exit;

$slug   = (string) get_query_var( 'wgba_slug' );
$lesson = \WGBA\Content_Repository::get_lesson_by_slug( $slug );
$staff  = \WGBA\Capabilities::can_manage_curriculum() || \WGBA\Access::user_is_admin();

if ( ! $lesson || ( 'publish' !== $lesson['status'] && ! $staff ) ) {
	\WGBA\Templates::header();
	status_header( 404 );
	echo '<div class="wgba-wrap"><h1>পাঠ পাওয়া যায়নি</h1></div>';
	\WGBA\Templates::footer();
	return;
}

$can_full  = \WGBA\Access::can_read_lesson_body( (string) $lesson['stable_id'] );
$chapter   = \WGBA\Content_Repository::get_chapter_by_stable_id( (string) $lesson['chapter_stable_id'] );
$payload   = is_array( $lesson['payload'] ) ? $lesson['payload'] : array();
$exercises = $payload['exercises'] ?? array();
$quiz      = $payload['quiz'] ?? null;

$GLOBALS['wgba_active_chapter'] = (string) $lesson['chapter_stable_id'];

// Flat published lesson list for Previous / Next.
$flat = array();
foreach ( \WGBA\Content_Repository::list_chapters( true ) as $ch_row ) {
	foreach ( \WGBA\Content_Repository::list_lessons_for_chapter( (string) $ch_row['stable_id'], true ) as $item ) {
		$flat[] = $item;
	}
}
$prev = null;
$next = null;
foreach ( $flat as $i => $item ) {
	if ( $item['stable_id'] === $lesson['stable_id'] ) {
		$prev = $i > 0 ? $flat[ $i - 1 ] : null;
		$next = isset( $flat[ $i + 1 ] ) ? $flat[ $i + 1 ] : null;
		break;
	}
}

if ( $can_full && is_user_logged_in() ) {
	\WGBA\Progress::touch_visit( get_current_user_id(), (string) $lesson['stable_id'], (string) $lesson['content_version'] );
	nocache_headers();
}

\WGBA\Templates::header();
?>
<div class="wgba-lesson-shell">
	<aside class="wgba-sidebar" aria-label="পাঠ্যক্রম">
		<button type="button" class="wgba-sidebar-toggle" data-wgba-sidebar-toggle>পাঠ তালিকা</button>
		<div class="wgba-sidebar-panel">
			<p class="wgba-sidebar-title">TUTORIAL</p>
			<?php foreach ( \WGBA\Content_Repository::list_chapters( true ) as $ch ) : ?>
				<details <?php echo ( $chapter && $ch['stable_id'] === $chapter['stable_id'] ) ? 'open' : ''; ?>>
					<summary><?php echo esc_html( (string) $ch['title'] ); ?></summary>
					<ul>
						<?php foreach ( \WGBA\Content_Repository::list_lessons_for_chapter( (string) $ch['stable_id'], true ) as $item ) : ?>
							<li class="<?php echo $item['stable_id'] === $lesson['stable_id'] ? 'is-current' : ''; ?>">
								<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'lesson', (string) $item['slug'] ) ); ?>"><?php echo esc_html( (string) $item['title'] ); ?></a>
							</li>
						<?php endforeach; ?>
					</ul>
				</details>
			<?php endforeach; ?>
		</div>
	</aside>
	<article class="wgba-article">
		<nav class="wgba-pager" aria-label="পাঠ নেভিগেশন">
			<?php if ( $prev ) : ?>
				<a class="wgba-btn wgba-btn-prev" href="<?php echo esc_url( \WGBA\Rewrite::url( 'lesson', (string) $prev['slug'] ) ); ?>">❮ আগের পাঠ</a>
			<?php else : ?>
				<span></span>
			<?php endif; ?>
			<?php if ( $next ) : ?>
				<a class="wgba-btn" href="<?php echo esc_url( \WGBA\Rewrite::url( 'lesson', (string) $next['slug'] ) ); ?>">পরের পাঠ ❯</a>
			<?php endif; ?>
		</nav>

		<header class="wgba-article-head">
			<h1><?php echo esc_html( (string) $lesson['title'] ); ?></h1>
			<p class="wgba-byline">লেখক: Muhibbullah Ansary · আপডেট: <?php echo esc_html( get_date_from_gmt( (string) $lesson['modified_gmt'], 'Y-m-d' ) ); ?></p>
			<p class="wgba-meta"><?php echo (int) $lesson['estimated_minutes']; ?> মিনিট
				<?php if ( ! empty( $lesson['required'] ) ) : ?> · আবশ্যক<?php endif; ?>
			</p>
		</header>

		<?php if ( ! $can_full ) : ?>
			<section class="wgba-card wgba-lock">
				<h2>পাবলিক সারাংশ</h2>
				<div class="wgba-prose"><?php echo wp_kses_post( (string) ( $lesson['public_overview'] ?: $lesson['summary'] ) ); ?></div>
				<p><?php echo esc_html( \WGBA\Access::message_login_for_chapters() ); ?></p>
				<p><a class="wgba-btn" href="<?php echo esc_url( add_query_arg( 'redirect_to', rawurlencode( \WGBA\Rewrite::url( 'lesson', (string) $lesson['slug'] ) ), \WGBA\Rewrite::url( 'login' ) ) ); ?>">লগইন করে পড়ুন</a></p>
			</section>
		<?php else : ?>
			<?php if ( ! empty( $lesson['objectives'] ) ) : ?>
				<ul class="wgba-objectives">
					<?php foreach ( (array) $lesson['objectives'] as $obj ) : ?>
						<li><?php echo esc_html( (string) $obj ); ?></li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
			<div class="wgba-prose" id="wgba-lesson-body">
				<?php echo wp_kses_post( (string) $lesson['body'] ); ?>
			</div>

			<?php
			$body_html       = (string) $lesson['body'];
			$extra_exercises = array_values(
				array_filter(
					(array) $exercises,
					static function ( $ex ) use ( $body_html ) {
						$id = (string) ( $ex['stable_id'] ?? '' );
						return '' !== $id && false === strpos( $body_html, 'data-exercise="' . $id . '"' );
					}
				)
			);
			?>
			<?php if ( $extra_exercises ) : ?>
				<section class="wgba-playground-section" aria-label="কোড অনুশীলন">
					<h2>Example — কোড অনুশীলন</h2>
					<p class="wgba-muted">রানার: QuickJS WASM Worker · নেটওয়ার্ক বন্ধ · ফরমেটিভ অনুশীলন</p>
					<?php foreach ( $extra_exercises as $ex ) : ?>
						<div class="wgba-playground"
							data-exercise-id="<?php echo esc_attr( (string) ( $ex['stable_id'] ?? '' ) ); ?>"
							data-exercise-version="<?php echo esc_attr( (string) ( $ex['version'] ?? '1' ) ); ?>"
							data-lesson-id="<?php echo esc_attr( (string) $lesson['stable_id'] ); ?>"
							data-starter="<?php echo esc_attr( (string) ( $ex['starter'] ?? '' ) ); ?>"
							data-expected="<?php echo esc_attr( wp_json_encode( $ex['expected_console_includes'] ?? array() ) ); ?>"
							data-expected-output="<?php echo esc_attr( (string) ( $ex['expected_output'] ?? '' ) ); ?>"
							data-hints="<?php echo esc_attr( wp_json_encode( $ex['hints'] ?? array() ) ); ?>"
							data-solution="<?php echo esc_attr( (string) ( $ex['solution'] ?? '' ) ); ?>"
							data-timeout-ms="<?php echo esc_attr( (string) absint( $ex['timeout_ms'] ?? 0 ) ); ?>"
							data-label="<?php echo esc_attr( (string) ( $ex['label'] ?? 'ফরমেটিভ অনুশীলন' ) ); ?>">
						</div>
					<?php endforeach; ?>
				</section>
			<?php endif; ?>

			<?php if ( is_array( $quiz ) ) : ?>
				<section class="wgba-quiz" data-quiz-id="<?php echo esc_attr( (string) ( $quiz['stable_id'] ?? '' ) ); ?>">
					<h2>জ্ঞান যাচাই</h2>
					<?php foreach ( (array) ( $quiz['questions'] ?? array() ) as $q ) : ?>
						<fieldset class="wgba-q" data-qid="<?php echo esc_attr( (string) ( $q['id'] ?? '' ) ); ?>">
							<legend><?php echo esc_html( (string) ( $q['prompt'] ?? '' ) ); ?></legend>
							<?php foreach ( (array) ( $q['choices'] ?? array() ) as $cid => $label ) : ?>
								<label><input type="radio" name="q_<?php echo esc_attr( (string) ( $q['id'] ?? '' ) ); ?>" value="<?php echo esc_attr( (string) $cid ); ?>"> <?php echo esc_html( (string) $label ); ?></label>
							<?php endforeach; ?>
						</fieldset>
					<?php endforeach; ?>
					<button type="button" class="wgba-btn" data-wgba-quiz-submit>জমা দিন</button>
					<div class="wgba-quiz-result" aria-live="polite"></div>
				</section>
			<?php endif; ?>

			<section class="wgba-progress-actions">
				<?php if ( is_user_logged_in() ) : ?>
					<button type="button" class="wgba-btn" data-wgba-mark-read data-lesson="<?php echo esc_attr( (string) $lesson['stable_id'] ); ?>">পড়া হয়েছে</button>
					<button type="button" class="wgba-btn wgba-btn-ghost" data-wgba-unmark-read data-lesson="<?php echo esc_attr( (string) $lesson['stable_id'] ); ?>">পড়া বাতিল</button>
					<button type="button" class="wgba-btn wgba-btn-ghost" data-wgba-bookmark data-id="<?php echo esc_attr( (string) $lesson['stable_id'] ); ?>">বুকমার্ক</button>
				<?php else : ?>
					<p class="wgba-muted"><?php echo esc_html( \WGBA\Access::message_login_for_progress() ); ?></p>
				<?php endif; ?>
			</section>

			<section class="wgba-ask" id="wgba-ask">
				<h2>এখানে প্রশ্ন করুন</h2>
				<?php if ( is_user_logged_in() ) : ?>
					<form data-wgba-question-form>
						<input type="hidden" name="lesson_stable_id" value="<?php echo esc_attr( (string) $lesson['stable_id'] ); ?>">
						<label>নির্বাচিত অংশ (ঐচ্ছিক)<textarea name="selected_text" rows="2"></textarea></label>
						<label>কোড (ঐচ্ছিক)<textarea name="code_snippet" rows="4"></textarea></label>
						<label>এরর (ঐচ্ছিক)<input name="error_text" type="text"></label>
						<label>আপনার প্রশ্ন<textarea name="question_body" required minlength="10" rows="4"></textarea></label>
						<p class="wgba-muted">শুধু উপরের ফিল্ডগুলো পাঠানো হবে—অন্য পেজ ডেটা নয়।</p>
						<div class="wgba-quick">
							<button type="button" data-quick="আরও সহজ করে বুঝান">আরও সহজ করে বুঝান</button>
							<button type="button" data-quick="আরেকটা বাস্তব উদাহরণ দিন">আরেকটা বাস্তব উদাহরণ দিন</button>
							<button type="button" data-quick="এই কোডে এমন হলো কেন?">এই কোডে এমন হলো কেন?</button>
							<button type="button" data-quick="আমাকে ছোট একটা অনুশীলন দিন">আমাকে ছোট একটা অনুশীলন দিন</button>
						</div>
						<button class="wgba-btn" type="submit">প্রশ্ন পাঠান</button>
						<p class="wgba-ask-status" aria-live="polite"></p>
					</form>
				<?php else : ?>
					<p><?php echo esc_html( \WGBA\Access::message_login_for_progress() ); ?></p>
				<?php endif; ?>
			</section>
		<?php endif; ?>

		<nav class="wgba-pager" aria-label="পাঠ নেভিগেশন নিচ">
			<?php if ( $prev ) : ?>
				<a class="wgba-btn wgba-btn-prev" href="<?php echo esc_url( \WGBA\Rewrite::url( 'lesson', (string) $prev['slug'] ) ); ?>">❮ আগের পাঠ</a>
			<?php else : ?>
				<span></span>
			<?php endif; ?>
			<?php if ( $next ) : ?>
				<a class="wgba-btn" href="<?php echo esc_url( \WGBA\Rewrite::url( 'lesson', (string) $next['slug'] ) ); ?>">পরের পাঠ ❯</a>
			<?php endif; ?>
		</nav>
	</article>
</div>
<script type="application/json" id="wgba-lesson-bootstrap"><?php
echo wp_json_encode(
	array(
		'stableId'  => $lesson['stable_id'],
		'canFull'   => $can_full,
		'exercises' => $can_full ? $exercises : array(),
	),
	JSON_UNESCAPED_UNICODE
);
?></script>
<?php
\WGBA\Templates::footer();
