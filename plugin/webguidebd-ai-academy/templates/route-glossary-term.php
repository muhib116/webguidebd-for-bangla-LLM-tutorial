<?php
defined( 'ABSPATH' ) || exit;
$slug  = (string) get_query_var( 'wgba_slug' );
$posts = get_posts( array( 'post_type' => 'wgba_glossary', 'name' => $slug, 'posts_per_page' => 1, 'post_status' => 'publish' ) );
\WGBA\Templates::header();
if ( ! $posts ) {
	\WGBA\Templates::page_hero(
		array(
			'title'  => 'শব্দ পাওয়া যায়নি',
			'crumbs' => array(
				array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
				array( 'label' => 'শব্দকোষ', 'url' => \WGBA\Rewrite::url( 'glossary' ) ),
			),
		)
	);
	\WGBA\Templates::footer();
	return;
}
$term          = $posts[0];
$synonyms      = array_filter( (array) get_post_meta( $term->ID, '_wgba_synonyms', true ) );
$lesson_slug   = (string) get_post_meta( $term->ID, '_wgba_lesson_slug', true );
$lesson_title  = (string) get_post_meta( $term->ID, '_wgba_lesson_title', true );
$lesson_public = (int) get_post_meta( $term->ID, '_wgba_lesson_public', true ) === 1;

\WGBA\Templates::page_hero(
	array(
		'title'  => $term->post_title,
		'lead'   => $synonyms ? ( 'অন্য নাম: ' . implode( ', ', array_map( 'strval', $synonyms ) ) ) : '',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'শব্দকোষ', 'url' => \WGBA\Rewrite::url( 'glossary' ) ),
			array( 'label' => $term->post_title ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<div class="wgba-card wgba-prose"><?php echo wp_kses_post( $term->post_content ); ?></div>
	<?php if ( '' !== $lesson_slug ) : ?>
		<p class="wgba-coming">বিস্তারিত শিখুন: <a href="<?php echo esc_url( \WGBA\Rewrite::url( 'lesson', $lesson_slug ) ); ?>"><?php echo esc_html( $lesson_title ); ?></a>
		<?php if ( ! $lesson_public && ! is_user_logged_in() ) : ?>
			<span class="wgba-muted">(এই পাঠ পড়তে লগইন প্রয়োজন)</span>
		<?php endif; ?>
		</p>
	<?php endif; ?>
</section>
<?php
\WGBA\Templates::footer();
