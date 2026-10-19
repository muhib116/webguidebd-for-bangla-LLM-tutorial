<?php
defined( 'ABSPATH' ) || exit;
if ( ! is_user_logged_in() ) {
	wp_safe_redirect( \WGBA\Rewrite::url( 'login' ) );
	exit;
}
$user = wp_get_current_user();
\WGBA\Templates::header();
\WGBA\Templates::page_hero(
	array(
		'title'  => 'প্রোফাইল',
		'lead'   => 'আপনার অ্যাকাউন্ট তথ্য।',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'প্রোফাইল' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<div class="wgba-card">
		<p><strong>নাম:</strong> <?php echo esc_html( $user->display_name ); ?></p>
		<p><strong>ইমেইল:</strong> <?php echo esc_html( $user->user_email ); ?></p>
		<p><strong>রোল:</strong> শিক্ষার্থী (Subscriber-স্তরের অনুমতি)</p>
		<p class="wgba-actions">
			<a class="wgba-btn" href="<?php echo esc_url( \WGBA\Rewrite::url( 'dashboard' ) ); ?>">ড্যাশবোর্ড »</a>
		</p>
	</div>
</section>
<?php
\WGBA\Templates::footer();
