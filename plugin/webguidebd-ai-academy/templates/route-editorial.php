<?php
defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();
\WGBA\Templates::page_hero(
	array(
		'title'  => 'সম্পাদকীয় ও সংশোধন নীতি',
		'lead'   => 'কনটেন্ট কীভাবে যাচাই ও আপডেট হয়।',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'সম্পাদকীয় নীতি' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<div class="wgba-card wgba-prose">
		<p>লেখক/নির্মাতা: <strong>Muhibbullah Ansary</strong>। পাঠে সূত্র ও যাচাই রেকর্ড থাকার কথা। যেখানে মানব বিশেষজ্ঞ রিভিউ হয়নি, তা দাবি করা হয় না।</p>
		<p>ভুল পেলে <a href="<?php echo esc_url( \WGBA\Rewrite::url( 'contact' ) ); ?>">যোগাযোগ</a> করুন—সংশোধনে আপডেট তারিখ ও নোট যোগ করা হবে।</p>
		<p>সিন্থেটিক ডেটাসেট, সিমুলেশন ও সরলীকৃত ডায়াগ্রাম স্পষ্টভাবে লেবেল করা হয়।</p>
	</div>
</section>
<?php
\WGBA\Templates::footer();
