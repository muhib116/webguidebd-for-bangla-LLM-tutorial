<?php
/**
 * Settings admin view.
 *
 * @package WebGuideBD\AIAcademy
 * @var array $settings Settings.
 * @var array $preview  Preview chapter IDs.
 */

defined( 'ABSPATH' ) || exit;
settings_errors( 'wgba' );
$chapters = \WGBA\Content_Repository::list_chapters( false );
?>
<div class="wrap">
	<h1>AI Academy সেটিংস</h1>
	<form method="post">
		<?php wp_nonce_field( 'wgba_settings', 'wgba_settings_nonce' ); ?>
		<h2>লেখক ও যোগাযোগ</h2>
		<?php
		$profile = \WGBA\Site_Profile::get();
		?>
		<p><label>প্রদর্শন নাম<br>
			<input class="regular-text" name="author_display_name" value="<?php echo esc_attr( (string) ( $settings['author_display_name'] ?? $profile['author_display_name'] ) ); ?>">
		</label></p>
		<p><label>ইমেইল<br>
			<input class="regular-text" type="email" name="author_email" value="<?php echo esc_attr( (string) ( $settings['author_email'] ?? $profile['author_email'] ) ); ?>">
		</label></p>
		<p><label>ফোন (বাংলাদেশ)<br>
			<input class="regular-text" name="author_phone" value="<?php echo esc_attr( (string) ( $settings['author_phone'] ?? $profile['author_phone'] ) ); ?>">
		</label></p>
		<p><label>ভূমিকা / টাইটেল<br>
			<input class="large-text" name="author_role" value="<?php echo esc_attr( (string) ( $settings['author_role'] ?? $profile['author_role'] ) ); ?>">
		</label></p>
		<p><label>বায়ো (HTML)<br>
			<textarea class="large-text" rows="8" name="author_bio"><?php echo esc_textarea( (string) ( $settings['author_bio'] ?? $profile['author_bio'] ) ); ?></textarea>
		</label></p>
		<p><label>এক্সপার্টাইজ (প্রতি ব্লক: প্রথম লাইন শিরোনাম, পরের লাইন বিবরণ; ব্লক খালি লাইন দিয়ে আলাদা)<br>
			<textarea class="large-text" rows="14" name="author_expertise_text"><?php echo esc_textarea( \WGBA\Site_Profile::expertise_text_for_admin() ); ?></textarea>
		</label></p>
		<p><label>লেখকের ছবি (Media Attachment ID — খালি রাখলে প্লাগইনের ডিফল্ট ছবি)<br>
			<input name="author_photo_id" type="number" value="<?php echo esc_attr( (string) (int) ( $settings['author_photo_id'] ?? 0 ) ); ?>">
		</label></p>
		<p><label>YouTube URL<br>
			<input class="large-text" name="author_youtube" value="<?php echo esc_attr( (string) ( $settings['author_youtube'] ?? $profile['author_youtube'] ) ); ?>">
		</label></p>
		<p><label>LinkedIn URL<br>
			<input class="large-text" name="author_linkedin" value="<?php echo esc_attr( (string) ( $settings['author_linkedin'] ?? $profile['author_linkedin'] ) ); ?>">
		</label></p>
		<p><label>Facebook URL<br>
			<input class="large-text" name="author_facebook" value="<?php echo esc_attr( (string) ( $settings['author_facebook'] ?? $profile['author_facebook'] ) ); ?>">
		</label></p>
		<p><label>Instagram URL<br>
			<input class="large-text" name="author_instagram" value="<?php echo esc_attr( (string) ( $settings['author_instagram'] ?? $profile['author_instagram'] ) ); ?>">
		</label></p>

		<h2>সাইটের হোমপেজ</h2>
		<p><label>
			<input type="checkbox" name="serve_as_front_page" value="1"
				<?php
				$serve_front = array_key_exists( 'serve_as_front_page', $settings )
					? ! empty( $settings['serve_as_front_page'] )
					: true;
				checked( $serve_front );
				?>>
			মেইন ডোমেইন (<code><?php echo esc_html( home_url( '/' ) ); ?></code>) এ AI Academy হোম দেখাও
		</label></p>
		<p class="description">চালু থাকলে মূল ওয়েবসাইটের হোমপেজের বদলে Academy দেখাবে। পাঠ/লগইন ইত্যাদি আগের মতো <code>/ai-academy/…</code>-এ থাকবে। <code>/ai-academy/</code> হোম থেকে সাইট রুটে রিডাইরেক্ট হবে।</p>

		<h2>পাবলিক প্রিভিউ অধ্যায়</h2>
		<p>অ্যাক্সেস <strong>stable chapter ID</strong> দিয়ে নির্ধারিত। ডিসপ্লে অর্ডার বদলালে অ্যাক্সেস বদলায় না।</p>
		<?php foreach ( $chapters as $ch ) : ?>
			<label style="display:block;margin:.25rem 0;">
				<input type="checkbox" name="public_preview[]" value="<?php echo esc_attr( (string) $ch['stable_id'] ); ?>"
					<?php checked( in_array( (string) $ch['stable_id'], $preview, true ) ); ?>>
				<code><?php echo esc_html( (string) $ch['stable_id'] ); ?></code> — <?php echo esc_html( (string) $ch['title'] ); ?>
			</label>
		<?php endforeach; ?>
		<p><label><input type="checkbox" name="confirm_preview_change" value="1"> প্রিভিউ সেট পরিবর্তন নিশ্চিত করছি (ক্যাশ ইনভ্যালিডেট হবে)</label></p>

		<h2>বিজ্ঞাপন (নিষ্ক্রিয় ডিফল্ট)</h2>
		<p><label><input type="checkbox" name="ads_enabled" value="1" <?php checked( ! empty( $settings['ads_enabled'] ) ); ?>> AdSense সক্রিয় (শুধু বৈধ publisher ID থাকলে)</label></p>
		<p><label>Publisher ID<br><input class="regular-text" name="ads_publisher_id" value="<?php echo esc_attr( (string) ( $settings['ads_publisher_id'] ?? '' ) ); ?>" placeholder="ca-pub-…"></label></p>

		<h2>AI Tutor (নিষ্ক্রিয় ডিফল্ট)</h2>
		<p><label><input type="checkbox" name="tutor_enabled" value="1" <?php checked( ! empty( $settings['tutor_enabled'] ) ); ?>> Tutor সক্রিয়</label></p>
		<p><label>API Key (লিখলে সেভ হবে; খালি রাখলে পুরনো অপরিবর্তিত)<br>
			<input class="regular-text" type="password" name="tutor_api_key" value="" autocomplete="new-password">
		</label></p>
		<p class="description">অ্যানালিটিক্স এই প্লাগইন থেকে সক্রিয় করা হয় না।</p>
		<?php submit_button( 'সংরক্ষণ' ); ?>
	</form>
</div>
