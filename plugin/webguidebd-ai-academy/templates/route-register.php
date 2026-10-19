<?php
defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();
$redirect = \WGBA\Access::sanitize_return_url( isset( $_GET['redirect_to'] ) ? rawurldecode( (string) wp_unslash( $_GET['redirect_to'] ) ) : '' );
$msg      = sanitize_key( (string) ( $_GET['wgba_msg'] ?? '' ) );

\WGBA\Templates::page_hero(
	array(
		'title'   => 'রেজিস্ট্রেশন',
		'lead'    => 'নতুন শিক্ষার্থী Subscriber হিসেবে যুক্ত হবেন। রিকোয়েস্টে role পাঠালেও উপেক্ষা করা হবে।',
		'eyebrow' => 'বিনামূল্যে · বাংলায়',
		'crumbs'  => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'রেজিস্ট্রেশন' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<div class="wgba-auth-shell">
		<div class="wgba-auth">
			<?php if ( 'exists' === $msg ) : ?><p class="wgba-error">অ্যাকাউন্ট তৈরি করা যায়নি। অন্য ইমেইল/ইউজারনেম চেষ্টা করুন।</p><?php endif; ?>
			<?php if ( 'invalid' === $msg ) : ?><p class="wgba-error">ইনপুট অবৈধ। পাসওয়ার্ড কমপক্ষে ৮ অক্ষর।</p><?php endif; ?>
			<form method="post" class="wgba-card">
				<?php wp_nonce_field( 'wgba_auth', 'wgba_auth_nonce' ); ?>
				<input type="hidden" name="wgba_auth_action" value="register">
				<input type="hidden" name="redirect_to" value="<?php echo esc_attr( $redirect ); ?>">
				<label>ইউজারনেম<input name="username" required autocomplete="username"></label>
				<label>ইমেইল<input name="email" type="email" required autocomplete="email"></label>
				<label>পাসওয়ার্ড<input name="password" type="password" required minlength="8" autocomplete="new-password"></label>
				<button class="wgba-btn" type="submit">অ্যাকাউন্ট খুলুন</button>
			</form>
			<p class="wgba-auth-links">
				<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'login' ) ); ?>">আগে থেকে অ্যাকাউন্ট আছে? লগইন</a>
			</p>
		</div>
	</div>
</section>
<?php
\WGBA\Templates::footer();
