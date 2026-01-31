import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { t } from 'ttag';
import { useLayoutStore } from '../store';
import { ChevronLeftIcon, NeoLogoText } from '../ui/foundation/icons';
import { colors } from '../ui/foundation/colors/colors';

// Static terms content from WordPress API
const TERMS_CONTENT = `<strong>What is this document?</strong><br>This document sets out the<strong> rules</strong> for the use of GenAI systems internally within Capgemini by Group Functions. Because of the nature and sensitivity of the tasks carried out by HR, there is a specific section at the end for the use of Gen AI systems in HR.<br><br><strong>Who is the target audience?</strong><br>Employees within Group Functions who are responsible for the<strong> deployment</strong> of Group Functions GenAI systems and/or who are the <strong>end user</strong> thereof.<br><br><strong>How should I use it?</strong><br>When using a GenAI system, please follow these rules. You should read this document in conjunction with (i) the <strong>specific guidance</strong> for your use case, which may modify or add to this document and (ii) to the <a href="https://talent.capgemini.com/global/pages/about_us/group_functions/group_technology_innovation/capgemini_technology/technology_domains/artificial_intelligence/generative_ai/">Group policies and guidelines</a> relating to Gen AI.<br><br><strong>Questions? </strong>Contact the Group Legal AI Office via <a href="mailto:grouplegalaioffice.in@capgemini.com">grouplegalaioffice.in@capgemini.com</a>.<br><br><strong>1)</strong> <strong>Do not use the Gen AI system for any prohibited practice under the EU AI Act.</strong><br>As of 2 February 2025, some AI practices are <strong>prohibited</strong> under the EU AI Act. Non-compliance can lead to severe fines and reputation damage. Capgemini therefore cannot use any GenAI system for:<br><br>• Deploying hidden or manipulative techniques that could harm someone.<br>• Taking advantage of people's vulnerabilities, such as their age, disability, or social/economic situation in a way that causes them or others harm.<br>• Evaluation or classification of persons over a period of time based on their social behaviour or personality, where this leads to unfavourable treatment.<br>• Predicting the risk of a person committing a criminal offence, based solely on profiling or assessing their personal traits or characteristics.<br>• Creating or expanding facial recognition databases through the untargeted scraping of facial images from the internet or CCTV footage.<br>• Inferring emotions of persons in the workplace or education institutions on the basis of their biometric data.<br>• Classifying people based on their biometric data to infer their race, political opinions, union membership, religious beliefs, sexlife, or sexual orientation.<br><br><strong>2)</strong> <strong>Only use GenAI systems as an assistant, not as an authority</strong>.<br>Many GenAI systems that Capgemini employees have access to are based on Large Language Models (LLMs). &nbsp;LLMs are trained to predict the next word in a sequence based on patterns in massive text datasets. They are&nbsp;statistical pattern recognizers, not repositories of verified facts. Their outputs are shaped by probabilities, not by a structured understanding of truth or domain-specific knowledge. This means they can generate output which seems plausible and convincing but is incorrect, incomplete or outdated, including entirely fictitious information (hallucinations). The GenAI system should therefore only <strong>support</strong> you in your tasks by enhancing productivity not be a replacement for your skill, experience and judgement. You remain responsible for checking that any outputs are correct and appropriate for their intended use.<br><br><strong>3)</strong> <strong>Be transparent about the use of GenAI systems and their outputs</strong>.<br>Fair and trustworthy AI requires that users and those who are impacted by it know that they are interacting with and/or are impacted by the GenAI system. This can also be a regulatory requirement.<br><br>• When using GenAI systems to generate or manipulate image, audio or video content, it must be disclosed that the content has been artificially generated or manipulated, especially when it concerns a deep fake.<br>• Especially when deploying systems impacting employees, there might be additional requirements before the GenAI system can be deployed. For example, in some countries, advice and/or approval from the workers council is required.<br><br><strong>4)</strong> <strong>Apply human oversight</strong>.<br>Because GenAI systems can produce incorrect outputs (see also rule 2), it is important to review the outputs before use. Especially when the impact of an incorrect output is severe. The level of human oversight that is required depends on the context of use and what is done with the output. A few examples, where you use a GenAI system to:<br><br>• Make the e-mail you drafted less formal, funnier, or more concise, without changing the core messages of the e-mail. <br>  • The need for human oversight and review is relatively low. You should check that the core messages have remained and if the tone of the e-mail is in line with your request.<br>• Write an advice or opinion for your manager on an important strategic topic for Capgemini. <br>  • In this case, you must carefully review the output before including it in your advice. You do not want to submit a document that includes 'hallucinations'.<br><br>To know which level of human oversight is appropriate, consider the environment (context) in which AI system is deployed and the impact of an inaccurate, incomplete or and/or harmful output.<br><br><strong>5)</strong> <strong>Do not use the GenAI system for automated decision-making about individuals and/or profiling</strong>.<br>The data used to train or fine-tune AI models that are the foundation of GenAI systems may include unwanted or harmful biases*. The output of the GenAI system built upon it can therefore also reflect these biases. What is 'unwanted' and 'harmful' depends on the cultural, political and societal context in which the system operates. Harmful biases are especially problematic where an GenAI system involves or supports automated individual decision-making and/or profiling**, introducing ethical, legal and regulatory concerns (e.g. discrimination). When conducting automated decision making and/or profiling, additional regulatory requirements or restraints can apply, for example from the GDPR or EU AI Act.<br><br><em>* Bias is an inclination in a particular direction and is often not illegal or unlawful. Bias can however result in discrimination, the unfair or prejudicial treatment of others, when actions are taken based on a certain bias. Discrimination is illegal and unlawful.</em><br><br><em>** Profiling means any form of automated processing of personal data consisting of the use of personal data to evaluate certain personal aspects relating to a natural person, in particular to analyse or predict aspects concerning that natural person's performance at work, economic situation, health, personal preferences, interests, reliability, behaviour, location or movements.</em><br><br><strong>6) Respect intellectual property</strong>.<br>Many AI models have been trained on material which is subject to third party intellectual property (IP) rights. The output of the GenAI system built upon those models can therefore include material which might infringe the rights of others. Also, it is not certain that Capgemini will own the copyright in AI-generated output.<br><br>• If you want to generate artistic images, sounds (e.g. voice), videos, logos or text, use only the GenAI systems that have been specifically approved by Capgemini for such use. Charts, diagrams, graphics or technical drawings are not considered 'artistic'.<br>• Only use the generated output for internal purposes. If you want to use the output externally, seek the approval of Group IP.<br><br><strong>7) Preserve confidentiality and protect (personal) data</strong>.<br>Some GenAI systems can be used in a 'Work' and 'Web' mode.<br><br>• In the <strong>'Work' mode</strong>, the system will have access to your Outlook, Teams, OneDrive and SharePoint and any output generated may include or embed information that is confidential, including SEC3 information. Therefore, you MUST carefully review any output generated to ensure that, depending on the intended use, does not contain any such information inadvertently (also see rule 4). Also remember to correctly apply the Capgemini 'sensitivity labels' (i.e. SEC 0 – SEC 3) on any document or material generated, as per the <a href="https://talent.capgemini.com/media_library/Medias/Group_Cybersecurity/Group_Cybersecurity_ISMS_Management_and_Technical_Control_Statements_Policy-v1.4.pdf">Group Cybersecurity ISMS Management and Technical Control Statements Policy834</a>.<br>• In <strong>'Web' mode</strong>, the system also has access to information available on the public internet. Third-party content may therefore appear in outputs and could be protected by copyright or other intellectual property rights. Do not embed or use such content unless you are certain it is authorized for use.<br>• In both <strong>'Work' and 'Web'</strong> mode, the information contained within your prompts, the data they retrieve, and the generated responses remain within a Capgemini controlled environment and are not used to train the underlying AI models.<br><br>Where GenAI systems process personal data, it is essential to assess and understand the following:<br><br>• The Reason for using personal data–be able to clearly explain and justify the need to use personal data. Do not process personal data for reasons unrelated to the intended use.<br>• The Quality/Source of personal data–inaccurate and poor quality of information can impact the output and lead to unintended consequences.<br>• Data Limitation/Minimization–only use the personal data you strictly need for your task, avoid the default use of large data sets or data lakes.<br><br><em>Further information on our data protection policies, guidelines and documents can be found on the <a href="https://capgemini.sharepoint.com/sites/globaldataprotectionhub"><em>Global Data Protection Hub</em></a>. For other types of data, always comply with the Group's cybersecurity policies.</em><br><br><strong>8)</strong> <strong>Ensure AI literacy</strong>.<br>The EU AI Act obliges Capgemini to ensure its staff has a sufficient level of AI literacy, which refers to the skills and knowledge needed to (develop and) use it responsibly and understand the risks and potential harms. Before deploying a GenAI system it is therefore key to ensure that employees who will be using it are sufficiently trained in the practical use, risks and potential harms of the GenAI system, considering their technical knowledge, experience, education and context of use.<br><br><em>For all Group approved GenAI technologies, </em><a href="https://capgemini.sharepoint.com/sites/office365-portal/TCs/Forms/AllItems.aspx?CT=1725621751961&amp;OR=OWA%2DNT%2DMail&amp;CID=94822aca%2D7a54%2De167%2Dff8c%2D68332efeb31e"><em>guidelines</em></a><em> are available, explaining the technology and listing the specific do's and don'ts related to it.</em><br><br><strong>9)</strong> <strong>Uphold Capgemini's ethical standards</strong>.<br>Even if a GenAI system is used in line with all legal requirements, it may be that such use is not desirable from an ethical perspective.<br>For example, inputting or generating malicious, offensive or obscene content.<br><br>• Apply the <a href="http://capgemini.com/about-us/who-we-are/our-values/our-ethical-culture/ethical-ai/">Capgemini Code of Ethics for AI</a>.<br>• Consult with your <a href="https://talent.capgemini.com/global/pages/about_us/group_functions/valuesandethics/ethics__compliance_network_new/">Ethics &amp; Compliance Officer </a>&nbsp;in case of doubt.&nbsp;<br>• Do not input or generate content that is malicious, offensive or obscene (e.g. hate speech).<br><br><strong>10) Report issues promptly</strong>.<br>Any inappropriate output, potential misuses or other concerns related to the use of the GenAI system must be reported to your manager.<br><br><strong>In addition to the rules set out above, this section applies in relation to GenAI systems deployed in the HR-function and/or support HR-related processes.</strong><br><br><strong>1) Key principles: GenAI for HR.</strong><br><br>Elevate HR through GenAI while ensuring the highest responsible Stewardship.<br><br>• Is transparent and visible to individuals and the manager.<br>• Has human oversight for any decision making.<br>• Maintains data privacy.<br>• Is inclusive.<br>• Supports professional approved processes, data and technology across the organization.<br>• Enhances agility by being directional in nature giving time to think for decision making.<br>• Has auditable inputs to outputs.<br><br><strong>2) Why is extra caution necessary if GenAI is used in HR?</strong><br>• Prohibited practice. <br>  o As of 2 February 2025, the EU AI Act prohibits certain AI practices because they pose an unacceptable risk of health, safety or fundamental rights of individuals.<br>  o A particular relevant prohibition is that of deploying AI systems that are used in the workplace to infer emotions of a natural person on the basis of their biometric data.<br>  o Such emotion recognition systems are not prohibited if used for medical or safety reasons, but this is a high threshold: <br>      AI systems used to detect burnout or depression in the workplace are not covered by the exception and remain prohibited.<br>       AI systems that assist blind or deaf employees in performing their tasks would probably fall under this exception and are therefore not prohibited.<br>• High-risk category. <br>  o Because of the nature of the HR-function, GenAI systems used in this context are more likely to be 'high-risk' under the EU AI Act.<br>  o Providers and some deployers (users) of such systems need to comply with stringent obligations as of August 2026.<br>  o AI systems involved in the following are by default high-risk: <br>       the recruitment and selection of employees, or<br>       decisions about employment terms, promotions, terminations, task allocations, and performance evaluations based on individual behavior or traits.<br>  o Exceptions may apply, making the AI system not high-risk after all, e.g. if it only performs 'supporting' or 'administrative' tasks, but this should be assessed on a case-by-case basis.<br>• Bias &amp; discrimination. <br>  o GenAI systems may include some degree of bias.<br>  o Unwanted and harmful biases can lead to discriminatory practices in hiring, promotions, and other HR decisions.<br>  o For example, if historical data reflects gender or racial biases, the GenAI might favour certain groups over others.<br>• Transparency. <br>  o GenAI systems are opaque and it might be challenging to understand how a certain output is produced.<br>  o Especially in HR, it is key yo being able to explain to employees why and how certain decisions are made.<br>  o It can be a regulatory requirement to inform employees if they are interacting with and/or affected by GenAI systems, because e.g. they are subject to certain processes supported or completely run by GenAI systems.<br>• Privacy and data protection. <br>  o By default, HR deals with a lot of (sensitive) personal data of employees and other confidential data. Therefore GenAI systems used in an HR context do also. The processing of this data requires extra caution to ensure it is processed in a legitimate and secure way.<br>• Dehumanization. <br>  o HR decisions often require certain nuances and consider intangible factors, which GenAI systems cannot always reflect.<br>  o By over-relying on GenAI employees might feel undervalued or neglected if they perceive that everything is handled by automated systems. This can negatively impact employee morale.<br>  o Dehumanization can be undesirable from a 'good employment practice' or ethical point of view.<br>• Workers council. <br>  o In some countries it might be mandatory to get the advice and/or approval from the workers council (or other worker's representatives) before the GenAI system can be deployed. This can even apply for pilots.<br><br><strong>3) What should I do?</strong><br>• Do not deploy any emotion recognition system in any Capgemini office to infer the emotions of employees or use the GenAI system for any other prohibited practice under the EU AI Act.<br>• Consult with your local(S)BU AI champion in the Legal team or the Group Legal AI Office before developing or procuring a GenAI system for high-risk purposes: <br>   o the recruitment and selection of employees, or<br>   o decisions about employment terms, promotions, terminations, task allocations, and performance evaluations based on individual behavior or traits.<br>• Do not use GenAI for automated decision-making about employees, except when you have explicit approval from the Group or Local DPO and/or the Group Legal AI Office.<br>• Inform employees in line with the local requirements that apply to the information provision of employees and/or the workers council or other worker's representatives if: <br>   o they are interacting with a GenAI system in any HR-process; and/or<br>   o HR uses certain GenAI systems that (in)directly affects them.<br>• Always ensure there is a human in the loop. Only use GenAI as your assistant, not your replacement.<br>• Follow the DPO guidance for your specific use case or GenAI system with regards to privacy and data protection.<br>• Consult with your local Legal team to check if advice and/or approval from the workers council is required before you can use the GenAI system.`;

/**
 * TermsScreen - Terms of Use page
 * Matches web design: NeoLogoText centered at top, "Terms of Use" h1 centered, content
 */
export const TermsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const [webViewHeight, setWebViewHeight] = useState(3000); // Initial estimate for long content

  // Theme colors
  const backgroundColor = isDarkTheme ? '#17191f' : '#f5f6f8';
  const textPrimary = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const textSecondary = isDarkTheme ? colors.gray['200'] : colors.gray['700'];
  const linkColor = colors.blue['600'];

  const handleBack = () => {
    navigation.goBack();
  };

  // Handle link clicks in WebView
  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;
    // Allow initial load
    if (url === 'about:blank' || url.startsWith('data:')) {
      return true;
    }
    // Open external links in browser
    if (url.startsWith('http') || url.startsWith('mailto:')) {
      Linking.openURL(url);
      return false;
    }
    return true;
  };

  // Handle WebView messages to get content height
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'contentHeight' && data.height) {
        setWebViewHeight(data.height + 50); // Add padding
      }
    } catch (e) {
      // Ignore parse errors
    }
  };

  // Generate HTML with proper styling for WebView
  const generateHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: 16px;
              line-height: 1.7;
              color: ${textSecondary};
              background-color: ${backgroundColor};
              padding: 0;
              margin: 0;
            }
            a {
              color: ${linkColor};
              text-decoration: underline;
            }
            strong, b {
              font-weight: 600;
              color: ${textPrimary};
            }
            em {
              font-style: italic;
            }
            br {
              display: block;
              content: "";
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          ${TERMS_CONTENT}
          <script>
            // Send content height to React Native
            function sendHeight() {
              const height = document.body.scrollHeight;
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'contentHeight', height: height }));
            }
            // Send on load and after a delay to ensure content is rendered
            sendHeight();
            setTimeout(sendHeight, 100);
            setTimeout(sendHeight, 500);
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Neo Logo - centered */}
        <View style={styles.logoContainer}>
          <NeoLogoText width={70} height={20} color={textPrimary} />
        </View>

        {/* Page Title - centered, matches web text-4xl font-normal */}
        <Text style={[styles.pageTitle, { color: textSecondary }]}>
          {t`Terms of Use`}
        </Text>

        {/* Content via WebView with dynamic height */}
        <View style={[styles.contentContainer, { height: webViewHeight }]}>
          <WebView
            source={{ html: generateHtml() }}
            style={[styles.webView, { backgroundColor }]}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            originWhitelist={['*']}
            scalesPageToFit={false}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  contentContainer: {
    width: '100%',
  },
  webView: {
    flex: 1,
    opacity: 0.99, // Fix for WebView rendering issues
  },
});

export default TermsScreen;
