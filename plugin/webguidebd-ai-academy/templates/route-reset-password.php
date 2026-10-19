<?php
defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();
$key   = sanitize_text_field( (string) ( $_GET['key'] ?? '' ) );
$login = sanitize_text_field( (string) ( $_GET['login'] ?? '' ) );

\WGBA\Templates::page_hero(
	array(
		'title'  => 'নতুন পাসওয়ার্ড',
		'lead'   => 'নতুন পাসওয়ার্ড সেট করে লগইন করুন।',
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
			<form method="post" class="wgba-card">
				<?php wp_nonce_field( 'wgba_auth', 'wgba_auth_nonce' ); ?>
				<input type="hidden" name="wgba_auth_action" value="reset_password">
				<input type="hidden" name="rp_key" value="<?php echo esc_attr( $key ); ?>">
				<input type="hidden" name="rp_login" value="<?php echo esc_attr( $login ); ?>">
				<label>নতুন পাসওয়ার্ড<input type="password" name="pass1" required minlength="8" autocomplete="new-password"></label>
				<label>আবার লিখুন<input type="password" name="pass2" required minlength="8" autocomplete="new-password"></label>
				<button class="wgba-btn" type="submit">আপডেট</button>
			</form>
		</div>
	</div>
</section>
<?php
\WGBA\Templates::footer();
