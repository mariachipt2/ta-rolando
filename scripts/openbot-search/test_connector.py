import importlib.util,json,tempfile,unittest,urllib.error
from pathlib import Path
from unittest.mock import Mock,patch
spec=importlib.util.spec_from_file_location('connector',Path(__file__).with_name('connector.py'))
connector=importlib.util.module_from_spec(spec);spec.loader.exec_module(connector)
JOB={'id':'00000000-0000-4000-8000-000000000001','lease_token':'00000000-0000-4000-8000-000000000002','source':'socialyte'}
class ConnectorTest(unittest.TestCase):
 def test_result_once_without_secret_in_agent_task(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'results').mkdir();(root/'results'/f"{JOB['id']}.json").write_text(json.dumps({'items':[],'warnings':['Fonte limitada']}),encoding='utf-8')
   proc=Mock();proc.poll.side_effect=[None,0,0];proc.returncode=0
   with patch.object(connector,'ROOT',root),patch.object(connector.subprocess,'Popen',return_value=proc) as launch,patch.object(connector,'call',return_value={'ok':True}) as api,patch.object(connector.time,'sleep'):
    connector.process('private-test-token',JOB)
   self.assertEqual([x.args[1]['action'] for x in api.call_args_list],['heartbeat','complete'])
   self.assertNotIn('private-test-token',str(launch.call_args))
   self.assertNotIn('private-test-token',proc.stdin.write.call_args.args[0].decode())
   self.assertIn('--id',launch.call_args.args[0]);proc.terminate.assert_not_called()
 def test_cancelled_lease_never_uploads_result(self):
  with tempfile.TemporaryDirectory() as d:
   proc=Mock();proc.poll.side_effect=[None,None]
   with patch.object(connector,'ROOT',Path(d)),patch.object(connector.subprocess,'Popen',return_value=proc),patch.object(connector,'call',side_effect=urllib.error.HTTPError('https://test',409,'cancelled',{},None)) as api:
    connector.process('private-test-token',JOB)
   self.assertEqual(api.call_count,1);proc.terminate.assert_called_once()
 def test_untrusted_source_or_job_id_never_executes(self):
  with patch.object(connector.subprocess,'Popen') as launch:
   for update in [{'source':'https://evil.test'},{'id':'../../private'}]:
    with self.assertRaises((RuntimeError,ValueError)):connector.process('private-test-token',{**JOB,**update})
   launch.assert_not_called()
if __name__=='__main__':unittest.main()
