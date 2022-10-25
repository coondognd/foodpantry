import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

const SessionStats = (props) => console.log("Render SessionStats") || (
    <Table aria-label="Today's Numbers">
      <TableBody>
        <TableRow>
          <TableCell>
            Total Clients Today:
          </TableCell>
          <TableCell>
            {props.clientsToday}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            Adults Today: 
          </TableCell>
          <TableCell>
            {props.adultsToday}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            Children Today:
          </TableCell>
          <TableCell>
            {props.childrenToday}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            Seniors Today
          </TableCell>
          <TableCell>
            {props.seniorsToday}
          </TableCell>
        </TableRow>
        
        
        <TableRow>
          <TableCell>
            By Town
          </TableCell>
          <TableCell>
          </TableCell>
        </TableRow>
  
        {Object.keys(props.clientsTodayByTown).map((town, total) => {
            <TableRow>
              <TableCell>{town}</TableCell>
              <TableCell>{total}</TableCell>
            </TableRow>
        })}
      </TableBody>
    </Table>
  );

  export default SessionStats;