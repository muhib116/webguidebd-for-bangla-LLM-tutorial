<?php
defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();
$redirect = \WGBA\Access::sanitize_return_url( isset( $_GET['redirect_to'] ) ? rawurldecode( (string) wp_unslash( $_GET['redirect_to'] ) ) : '' );
$msg      = sanitize_key( (string) ( $_GET['wgba_msg'] ?? '' ) );

\WGBA\Templates::page_hero(
	array(
		'title'   => 'লগইন',
		'lead'    => 'অ্যাকাউন্ট দিয়ে পূর্ণ পাঠ, অগ্রগতি ও অনুশীলন সংরক্ষণ করুন।',
		'eyebrow' => 'বিনামূল্যে · বাংলায়',
		'crumbs'  => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'লগইন' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<div class="wgba-auth-shell">
		<div class="wgba-auth">
			<?php if ( 'failed' === $msg ) : ?><p class="wgba-error">লগইন ব্যর্থ। আবার চেষ্টা করুন।</p><?php endif; ?>
			<?php if ( 'reset_ok' === $msg ) : ?><p class="wgba-ok">পাসওয়ার্ড আপডেট হয়েছে। এখন লগইন করুন।</p><?php endif; ?>
			<form method="post" class="wgba-card">
				<?php wp_nonce_field( 'wgba_auth', 'wgba_auth_nonce' ); ?>
				<input type="hidden" name="wgba_auth_action" value="login">
				<input type="hidden" name="redirect_to" value="<?php echo esc_attr( $redirect ); ?>">
				<label>ইউজারনেম বা ইমেইল<input name="log" required autocomplete="username"></label>
				<label>পাসওয়ার্ড<input name="pwd" type="password" required autocomplete="current-password"></label>
				<label><input type="checkbox" name="rememberme" value="1"> মনে রাখুন</label>
				<button class="wgba-btn" type="submit">লগইন</button>
			</form>
			<p class="wgba-auth-links">
				<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'register' ) ); ?>">নতুন অ্যাকাউন্ট</a> ·
				<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'lost_password' ) ); ?>">পাসওয়ার্ড ভুলে গেছি</a>
			</p>
		</div>
	</div>
</section>
<?php
\WGBA\Templates::footer();
