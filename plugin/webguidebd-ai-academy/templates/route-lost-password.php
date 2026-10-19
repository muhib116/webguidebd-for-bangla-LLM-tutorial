<?php
defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();
$msg = sanitize_key( (string) ( $_GET['wgba_msg'] ?? '' ) );

\WGBA\Templates::page_hero(
	array(
		'title'  => 'পাসওয়ার্ড পুনরুদ্ধার',
		'lead'   => 'ইমেইলে রিসেট লিংক পাঠানো হবে (হোস্ট মেইল কনফিগের উপর নির্ভরশীল)।',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'পাসওয়ার্ড' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<div class="wgba-auth-shell">
		<div class="wgba-auth">
			<?php if ( 'sent' === $msg ) : ?>
				<p class="wgba-ok">যদি অ্যাকাউন্ট থাকে, পুনরুদ্ধার নির্দেশনা ইমেইলে পাঠানো হয়েছে।</p>
			<?php endif; ?>
			<form method="post" class="wgba-card">
				<?php wp_nonce_field( 'wgba_auth', 'wgba_auth_nonce' ); ?>
				<input type="hidden" name="wgba_auth_action" value="lost_password">
				<label>ইউজারনেম বা ইমেইল<input name="user_login" required></label>
				<button class="wgba-btn" type="submit">লিংক পাঠান</button>
			</form>
			<p class="wgba-auth-links">
				<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'login' ) ); ?>">লগইনে ফিরুন</a>
			</p>
		</div>
	</div>
</section>
<?php
\WGBA\Templates::footer();
