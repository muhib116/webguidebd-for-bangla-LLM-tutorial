<?php
/**
 * Staff question reply UI.
 *
 * @package WebGuideBD\AIAcademy
 * @var array|null $rows Rows.
 */

defined( 'ABSPATH' ) || exit;
?>
<div class="wrap">
	<h1>শিক্ষার্থীর প্রশ্ন (ব্যক্তিগত)</h1>
	<table class="widefat striped">
		<thead><tr><th>ID</th><th>User</th><th>Lesson</th><th>প্রশ্ন</th><th>উত্তর</th></tr></thead>
		<tbody>
		<?php foreach ( (array) $rows as $row ) : ?>
			<tr>
				<td><?php echo (int) $row['id']; ?></td>
				<td><?php echo (int) $row['user_id']; ?></td>
				<td><code><?php echo esc_html( (string) $row['lesson_stable_id'] ); ?></code></td>
				<td><?php echo esc_html( (string) $row['question_body'] ); ?></td>
				<td>
					<form method="post">
						<?php wp_nonce_field( 'wgba_reply', 'wgba_reply_nonce' ); ?>
						<input type="hidden" name="question_id" value="<?php echo (int) $row['id']; ?>">
						<textarea name="staff_reply" rows="3" class="large-text"><?php echo esc_textarea( (string) ( $row['staff_reply'] ?? '' ) ); ?></textarea>
						<?php submit_button( 'উত্তর সেভ', 'secondary', 'submit', false ); ?>
					</form>
				</td>
			</tr>
		<?php endforeach; ?>
		</tbody>
	</table>
</div>
