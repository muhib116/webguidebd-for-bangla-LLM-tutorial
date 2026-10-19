<?php
defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();
$terms = get_posts( array( 'post_type' => 'wgba_glossary', 'posts_per_page' => 200, 'post_status' => 'publish', 'orderby' => 'title', 'order' => 'ASC' ) );

\WGBA\Templates::page_hero(
	array(
		'title'  => 'শব্দকোষ',
		'lead'   => 'AI ও LLM টার্মের বাংলা ব্যাখ্যা—খুঁজে দ্রুত পড়ুন।',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'শব্দকোষ' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<label class="wgba-search">খুঁজুন <input type="search" data-wgba-glossary-filter placeholder="বাংলা বা English"></label>
	<ul class="wgba-glossary" data-wgba-glossary>
		<?php foreach ( $terms as $term ) : ?>
			<li data-text="<?php echo esc_attr( strtolower( $term->post_title . ' ' . wp_strip_all_tags( $term->post_content ) ) ); ?>">
				<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'glossary_term', $term->post_name ) ); ?>"><strong><?php echo esc_html( $term->post_title ); ?></strong></a>
				<div class="wgba-prose"><?php echo wp_kses_post( wp_trim_words( $term->post_content, 40 ) ); ?></div>
			</li>
		<?php endforeach; ?>
	</ul>
</section>
<?php
\WGBA\Templates::footer();
